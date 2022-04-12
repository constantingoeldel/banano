import banano from "@bananocoin/bananojs";
import axios from "axios";
import { Order } from "./_types";
import { InsertOneResult, MongoClient, WithId } from "mongodb";
let client = new MongoClient(process.env.MONGODB_URI!);

banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");

const privateKey = banano.getPrivateKey(process.env.SEED, 0);
const publicKey = await banano.getPublicKey(privateKey);
const account = banano.getBananoAccount(publicKey);

const MARGIN = Number(process.env.MARGIN!);

client = await client.connect();
const collection = client.db("Banano").collection("orders");

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


 


async function getOrders(): Promise<Order[]> {
  const orders = await collection.find({}).toArray() as WithId<Order>[];
  return orders;
}

async function getOrder(pi: string) {
  const order = (await collection.findOne({ paymentIntent: pi })) as WithId<Order>;
  return order;
}

async function updateStatus(pi: string, status: string) {
  collection.updateOne({ paymentIntent: pi }, { $set: { status } });
}

async function addOrder(
  paymentIntent: string,
  address: string,
  amount: number,
  price: number,
  test: boolean
) {

  const order = {
    timestamp: Date.now(),
    address,
    paymentIntent,
    amount: test ? 0.01 : amount,
    price,
    status: "open",
    test,
  };
  const { insertedId } = (await collection.insertOne(order)) as InsertOneResult<Order>;
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
