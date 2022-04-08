const run = async () => {
    require('dotenv').config()
    const fs = require("fs")
    const TEST = process.env.TEST
    const bananojs = require('@bananocoin/bananojs')
    const axios = require('axios')
    const stripeJs = require('stripe')
    stripe = TEST ? stripeJs(process.env.STRIPE_TEST_SECRET) : stripeJs(process.env.STRIPE_SECRET)
    const express = require('express')
    const app = express()
    app.use(express.static('public'))

    app.use(express.urlencoded({
        extended: true
    }))
    console.log("Starting the server in", TEST ? "test" : "production", "mode")

    const sendBanano = (amount, recipient) => {
        const rawAmount = bananojs.getRawStrFromBananoStr(String(amount))
        bananojs.sendAmountToBananoAccount(process.env.SEED, 0, recipient, rawAmount, (hash) => console.log(hash), error => console.log(error))
    }

    const URL = "https://banano.acctive.digital"
    bananojs.setBananodeApiUrl('https://kaliumapi.appditto.com/api')


    const privateKey = bananojs.getPrivateKey(process.env.SEED, 0)
    const publicKey = await bananojs.getPublicKey(privateKey)
    const account = bananojs.getBananoAccount(publicKey)

    app.get('/status', async (req, res) => {
        console.log("New visitor")
        try {
            await bananojs.getAccountsPending([account], 10)
            await bananojs.receiveBananoDepositsForSeed(process.env.SEED, 0, process.env.REPRESENTATIVE)
            const accountInfo = await bananojs.getAccountInfo(account)
            const balance = Math.floor(accountInfo.balance_decimal)
            const banano = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur')
            const exchangeRate = banano.data.banano.eur
            const data = JSON.parse(fs.readFileSync("orders.json"))
            const customers = data.filter(order => order.status === "successful")
            const total = customers.reduce((sum, order) => sum + order.price, 0)

            res.json({ total, status: "good", customers: customers.length, rate: exchangeRate, max: balance })
        }
        catch (err) {
            console.log(err)
            res.status(500).end()
        }
    })


    app.post('/create-checkout-session', async (req, res) => {
        await bananojs.getAccountsPending([account], 10)
        await bananojs.receiveBananoDepositsForSeed(process.env.SEED, 0, process.env.REPRESENTATIVE)
        const accountInfo = await bananojs.getAccountInfo(account)
        try {
            const amount = Number(req.body.amount)
            const address = req.body.address
            const balance = Math.floor(accountInfo.balance_decimal)
            if (!amount || amount < 100 || amount > balance) {
                res.status(400).json({ status: "invalid amount entered. ", min_amount: 100, max_amount: balance, your_amount: amount }).end()
                return
            }
            if (!address.match("ban_.{60}")) {
                res.status(400).json({ status: "invalid address. Please provide a valid ban address" }).end()
                return
            }

            const banano = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur')
            const exchangeRate = banano.data.banano.eur
            const price = Math.ceil(((amount * exchangeRate * 1.05) * 100))
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    //     price: TEST ? process.env.TEST_PRODUCT : process.env.PRODUCT, quantity: Math.round(amount / 100), adjustable_quantity: {
                    //         enabled: true,
                    //         minimum: 1,
                    //         maximum: 100
                    //     },
                    // },
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: amount + ' Bananos',
                                description: "Price is the amount of bananos times the current exchange rate."
                            },

                            unit_amount: price
                        },

                        quantity: 1,
                    },
                    // {
                    //     price: "price_1KgZl7C8LRlUDDCkErb7HMR5",
                    //     quantity: amount
                    // }
                ],
                mode: 'payment',
                allow_promotion_codes: true,
                success_url: URL + '/',
                cancel_url: URL + '/',
            })
            const paymentIntent = session.payment_intent

            addOrder(paymentIntent, address, amount, price)
            console.log("Payment intent registered")

            res.redirect(303, session.url)
        }
        catch (error) {
            console.log(error)
            res.redirect(500, "/")
        }
    })

    app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
        const sig = request.headers['stripe-signature']
        let event
        try {
            event = stripe.webhooks.constructEvent(request.body, sig, process.env.ENDPOINT)
        } catch (err) {
            console.log(err.message)
            response.status(400).send(`Webhook Error: ${err.message}`)
            return
        }
        console.log('handling the webhook')

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                try {
                    const paymentIntent = event.data.object
                    console.log(paymentIntent)
                    const findOrderAddressAndAmountByPaymentIntent = (pi) => {
                        let data = JSON.parse(fs.readFileSync("orders.json"))
                        const order = data.find(order => order.paymentIntent == pi)
                        return order ? { address: order.address, amount: order.amount } : null
                    }
                    const updateStatus = (pi) => {
                        let data = JSON.parse(fs.readFileSync("orders.json"))
                        const updated = data.map(order => {
                            if (order.paymentIntent == pi) {
                                order.status = 'successful'
                            }
                            return order
                        })
                        fs.writeFile("orders.json", JSON.stringify(updated, null, 2), (err) => {
                            if (err) throw err
                            console.log("Updated Status")
                        })


                    }
                    const { address, amount } = findOrderAddressAndAmountByPaymentIntent(paymentIntent.id)
                    console.log('Successfully payed! Now sending ' + amount + " bananos to " + address)

                    address && amount && sendBanano(amount, address)
                    updateStatus(paymentIntent.id)


                    console.log("Order fulfilled")
                } catch (err) {
                    console.log(err)
                }
                break
            case 'payment_method.attached':
                const paymentMethod = event.data.object
                console.log('PaymentMethod was attached to a Customer!')
                break
            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`)
        }

        // Return a 200 response to acknowledge receipt of the event
        response.json({ received: true })
    })


    app.listen(4242, () => console.log('Running on port 4242'))

    function addOrder(paymentIntent, address, amount, price) {
        // Requiring fs module


        // Storing the JSON format data in myObject
        let data = JSON.parse(fs.readFileSync("orders.json"))

        // Defining new data to be added
        const order = {
            timestamp: Date.now(),
            address,
            paymentIntent,
            amount,
            price,
            status: "open"
        }

        // Adding the new data to our object
        data.push(order)

        // Writing to our JSON file
        let json = JSON.stringify(data, null, 2)
        fs.writeFile("orders.json", json, (err) => {
            // Error checking
            if (err) throw err
            console.log("New order added")
        })

    }

}
run()