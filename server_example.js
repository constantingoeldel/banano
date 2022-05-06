const express = require("express")
const banano = require("@bananocoin/bananojs")
const axios = require('axios')
require('dotenv').config()

const server = express()
server.use(express.json())
banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api")

server.get("/", async (req, res) => {
    if (!req.headers["authorization"] || req.headers["authorization"] !== process.env.API_SECRET) {
        res.status(401).send("Unauthorized")
        console.log("Unauthorized balance request")
        return
    }
    await banano.receiveBananoDepositsForSeed(process.env.SEED, 0, process.env.REPRESENTATIVE)
    const address = process.env.ADDRESS
    const margin = 1.02
    const balance = await getBalance(address)
    let rate = (await getRate()) * margin
    console.log("Gave offer for " + balance + " Banano at a price of " + rate + "€/BAN")
    res.json({ balance, rate })
})

server.post("/", async (req, res) => {
    console.log(req.body)
    const requestIsValid = ({ payment, amount, address }) => {
        // implementation left up to the user
        return true
    }
    if (!req.headers["authorization"] || req.headers["authorization"] !== process.env.API_SECRET) {
        res.status(401).send("Unauthorized")
        console.log("Unauthorized payment request")
        return
    }
    if (!requestIsValid(req.body)) {
        res.status(400).send("Invalid request")
        return
    }
    const hash = await sendBanano(req.body.amount, req.body.address, process.env.SEED)
    res.json({ hash })
})

server.listen(3003, () => {
    console.log("Server listening on port 3003")
})

async function sendBanano(amount, recipient, seed) {
    return new Promise(async (resolve, reject) => {
        const rawAmount = banano.getRawStrFromBananoStr(String(amount))
        banano.sendAmountToBananoAccount(
            seed,
            0,
            recipient,
            rawAmount,
            (hash) => {
                console.log("Transaction hash:", hash), resolve(hash)
            },
            (error) => reject(error)
        )
    })
}

async function getBalance(account) {
    const accountInfo = await banano.getAccountInfo(account)
    return Math.floor(accountInfo.balance_decimal)
}
async function getRate() {
    const banano = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur"
    )
    const exchangeRate = banano.data.banano.eur

    return exchangeRate
}
