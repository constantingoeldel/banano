import axios from "axios";
import { InsertOneResult, MongoClient, WithId } from "mongodb";
import { Order } from "./_types";
let client = new MongoClient(process.env.MONGODB_URI!);

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
  if (!pi) {
    throw new Error("Payment Intent is required");
  }
  const order = await collection.findOne<WithId<Order>>({
    paymentIntent: pi,
  });
  if (!order) {
    throw new Error("Order with payment ID " + pi + " not found");
  }
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
    console.log("DEV: ", process.env.DEV);
    const DEV = process.env.DEV ? true : false;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: "constantingoeldel@gmail.com", // Change to your recipient
      from: "server@banano.acctive.digital", // Change to your verified sender
      subject: "Message from the banano server",
      text: message,
    };
    DEV
      ? resolve("Not sending email as in DEV mode")
      : sgMail
          .send(msg)
          .then(() => {
            resolve("Email sent");
          })
          .catch((error: unknown) => {
            reject(error);
          });
  });
}

export { getRate, addOrder, getOrders, sendMail, getOrder, updateStatus };
