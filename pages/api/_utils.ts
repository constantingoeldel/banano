import axios from "axios";
import { InsertOneResult, MongoClient, WithId } from "mongodb";
import { resolve } from "path";
import { Order } from "./_types";
let client = new MongoClient(process.env.MONGODB_URI!);
// rerwerit banano sending

const MARGIN = Number(process.env.MARGIN!);

client = await client.connect();
const collection = client.db("Banano").collection("orders");

async function getRate() {
  const banano = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur"
  );
  const exchangeRate = banano.data.banano.eur * MARGIN;

  return exchangeRate;
}

async function getOrders(): Promise<Order[]> {
  const orders = (await collection.find({}).toArray()) as WithId<Order>[];
  return orders;
}

async function getOrder(pi: string) {
  const order = (await collection.findOne({
    paymentIntent: pi,
  })) as WithId<Order>;
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
  return new Promise((resolve, reject) => {
    const sgMail = require("@sendgrid/mail");
    const TEST = !!process.env.TEST!;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: "constantingoeldel@gmail.com", // Change to your recipient
      from: "server@banano.acctive.digital", // Change to your verified sender
      subject: "Message from the banano server",
      text: message,
    };

    sgMail
      .send(msg)
      .then(() => {
        resolve("Email sent");
      })
      .catch((error: unknown) => {
        console.error(error);
        reject(error);
      });
  });
}

export { getRate, addOrder, getOrders, sendMail, getOrder, updateStatus };
