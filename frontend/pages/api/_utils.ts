import banano from "@bananocoin/bananojs";
import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { Order } from "./_types";

banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");

const privateKey = banano.getPrivateKey(process.env.SEED, 0);
const publicKey = await banano.getPublicKey(privateKey);
const account = banano.getBananoAccount(publicKey);

const MARGIN = Number(process.env.MARGIN!);

async function sendBanano(amount: number, recipient: string) {
  const rawAmount = banano.getRawStrFromBananoStr(String(amount));
  banano.sendAmountToBananoAccount(
    process.env.SEED,
    0,
    recipient,
    rawAmount,
    (hash: string) => console.log(hash),
    (error: any) => console.log(error)
  );
}

async function getBalance() {
  await banano.getAccountsPending([account], 10);
  await banano.receiveBananoDepositsForSeed(process.env.SEED, 0, process.env.REPRESENTATIVE);
  const accountInfo = await banano.getAccountInfo(account);
  const balance = Math.floor(accountInfo.balance_decimal);
  return balance;
}

async function getRate() {
  const banano = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur"
  );
  const exchangeRate = banano.data.banano.eur * MARGIN;

  return exchangeRate;
}

async function getDBCollection() {
  const { MongoClient } = require("mongodb");
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const collection = client.db("Banano").collection("orders");
  return collection;
}

async function getOrders(): Promise<Order[]> {
  const collection = await getDBCollection();
  const orders = (await collection.find({}).toArray()) as Order[];
  return orders;
}

async function getOrder(pi: string) {
  const collection = await getDBCollection();
  const order = (await collection.findOne({ paymentIntent: pi })) as Order;
  return order;
}

async function updateStatus(pi: string, status: string) {
  const collection = await getDBCollection();
  collection.updateOne({ paymentIntent: pi }, { $set: { status } });
}

async function addOrder(
  paymentIntent: string,
  address: string,
  amount: number,
  price: number,
  test: boolean
) {
  const collection = await getDBCollection();

  const order = {
    timestamp: Date.now(),
    address,
    paymentIntent,
    amount: test ? 0.01 : amount,
    price,
    status: "open",
    test,
  };
  const { insertedId } = (await collection.insertOne(order)) as { insertedId: string };
  return insertedId;
}

function sendMail(message: string) {
  const sgMail = require("@sendgrid/mail");
  const TEST = !!process.env.TEST!;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: "constantingoeldel@gmail.com", // Change to your recipient
    from: "transform@acctive.digital", // Change to your verified sender
    subject: "Message from the banano server",
    text: message,
  };
  TEST ||
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error: unknown) => {
        console.error(error);
      });
}

export { getBalance, getRate, addOrder, sendBanano, getOrders, sendMail, getOrder, updateStatus };
