const run = async () => {
    require('dotenv').config()
    const fs = require("fs")
    const TEST = process.env.TEST
    const bananojs = require('@bananocoin/bananojs')
    const axios = require('axios')
    const stripeJs = require('stripe')
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
            const balance = await getBalance(bananojs, account)
            const exchangeRate = await getRate()
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
        console.log("Received new checkout request")
        try {
            if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
                console.log("Not captcha header, aborting")
                return res.json({ "responseError": "captcha error" })
            }
            const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + process.env.CAPTCHA + "&response=" + req.body['g-recaptcha-response']
            const approval = await axios.post(verificationURL)
            if (!approval.data.success) {
                console.log("Invalid captcha header, aborting", approval.data.success, approval.data["error-codes"])
                return res.json({ "responseError": "captcha error" })
            }
            console.log("Request is valid")

            const amount = Number(req.body.amount)
            const test = req.body.test || false
            test && console.log("Test payment requested")
            const address = req.body.address
            const balance = await getBalance(bananojs, account)
            if (!amount || amount < 100 || amount > balance) {
                res.status(400).json({ status: "invalid amount entered. ", min_amount: 100, max_amount: balance, your_amount: amount }).end()
                return
            }
            if (!address.match("ban_.{60}")) {
                res.status(400).json({ status: "invalid address. Please provide a valid ban address" }).end()
                return
            }


            const exchangeRate = await getRate()
            const price = Math.ceil(amount * exchangeRate * 100) + 25
            stripe = test ? stripeJs(process.env.STRIPE_TEST_SECRET) : stripeJs(process.env.STRIPE_SECRET)
            const session = await stripe.checkout.sessions.create({
                line_items: [

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

                ],
                mode: 'payment',
                allow_promotion_codes: true,
                success_url: URL + '/',
                cancel_url: URL + '/',
            })
            const paymentIntent = session.payment_intent

            addOrder(paymentIntent, address, amount, price, !!test)
            console.log("Payment intent registered")

            res.redirect(303, session.url)
        }
        catch (error) {
            console.log(error)
            res.redirect(500, "/")
        }
    })
    app.post('/test/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
        const stripe = stripeJs(process.env.STRIPE_TEST_SECRET)
        const sig = request.headers['stripe-signature']
        let event
        const webhookSecret = process.env.TEST_ENDPOINT
        try {
            event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret)
        } catch (err) {
            console.log(err.message, sig, webhookSecret)
            response.status(400).send(`Webhook Error: ${err.message}`)
            return
        }
        console.log('handling the webhook')

        // Handle the event
        handleWebhook(event, fs, sendBanano)

        // Return a 200 response to acknowledge receipt of the event
        response.json({ received: true })
    })

    app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
        const stripe = stripeJs(process.env.STRIPE_SECRET)
        const sig = request.headers['stripe-signature']
        let event
        const webhookSecret = process.env.ENDPOINT
        try {
            event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret)
        } catch (err) {
            console.log(err.message, sig, webhookSecret)
            response.status(400).send(`Webhook Error: ${err.message}`)
            return
        }
        console.log('handling the webhook')

        // Handle the event
        handleWebhook(event, fs, sendBanano)

        // Return a 200 response to acknowledge receipt of the event
        response.json({ received: true })
    })

    const port = TEST ? 4243 : 4242
    app.listen(port, () => console.log('Running on port ' + port))

    async function getRate() {
        const banano = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur')
        const exchangeRate = banano.data.banano.eur * process.env.MARGIN

        return exchangeRate
    }

    function addOrder(paymentIntent, address, amount, price, test) {
        let data = JSON.parse(fs.readFileSync("orders.json"))

        const order = {
            timestamp: Date.now(),
            address,
            paymentIntent,
            amount: test ? 0.01 : amount,
            price,
            status: "open",
            test
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

try {
    run()
}
catch (err) {
    console.error(err)

}
function handleWebhook(event, fs, sendBanano) {
    switch (event.type) {
        case 'payment_intent.succeeded':
            try {
                const paymentIntent = event.data.object
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
                        if (err)
                            throw err
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
}

async function getBalance(bananojs, account) {
    await bananojs.getAccountsPending([account], 10)
    await bananojs.receiveBananoDepositsForSeed(process.env.SEED, 0, process.env.REPRESENTATIVE)
    const accountInfo = await bananojs.getAccountInfo(account)
    const balance = Math.floor(accountInfo.balance_decimal)
    return balance
}

