import { MongoClient, WithId } from "mongodb";
import { CustodialSource, ManualSource, Offer, Order, User } from "../types";

let client = new MongoClient(process.env.MONGODB_URI!);

client = await client.connect();
export const orders = client.db("Banano").collection<Order>("orders");
export const sources = client.db("Banano").collection<ManualSource | CustodialSource>("sources");
export const users = client.db("Banano").collection<User>("users");

export async function getUser(id: string) {
  return await users.findOne({ id });
}

export async function getOrders(): Promise<Order[]> {
  const successfullOrders = (await orders
    .find({ status: "successful", test: false })
    .toArray()) as WithId<Order>[];
  return successfullOrders;
}

export async function getUserOrders(address: string) {
  return (await orders.find({ address: address }).toArray()) as WithId<Order>[];
}

export async function getOrder(pi: string) {
  const order = await orders.findOne<WithId<Order>>({
    paymentIntent: pi,
  });
  if (!order) {
    throw new Error("Order with payment ID " + pi + " not found");
  }
  return order;
}

export async function getSource(sid: string) {
  const order = await sources.findOne({
    sid: sid,
  });
  if (!order) {
    throw new Error("Source with source ID " + sid + " not found");
  }
  return order;
}

export async function updateStatus(pi: string, status: Order["status"]) {
  orders.updateOne({ paymentIntent: pi }, { $set: { status } });
}

export async function addOrder(
  paymentIntent: string,
  source: ManualSource | CustodialSource,
  offer: Offer,
  transferGroup: string,
  address: string,
  amount: number,
  price: number,
  test: boolean
) {
  const order: Order = {
    timestamp: Date.now(),
    offer,
    source,
    transferGroup,
    address,
    paymentIntent,
    amount: test ? 0.01 : amount,
    price,
    status: "open",
    test,
  };
  const { insertedId } = await orders.insertOne(order);
  return insertedId;
}

export async function addSource(source: ManualSource | CustodialSource) {
  const { insertedId } = await sources.insertOne(source);
  return insertedId;
}
