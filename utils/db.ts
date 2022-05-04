import { MongoClient, ObjectId, WithId } from "mongodb";
import { CustodialSource, ManualSource, Offer, Order, User } from "../types";
import { nanoid } from "nanoid";
const URL = process.env.DEV ? "dev.acctive.digital" : "https://banano.acctive.digital";

console.log("Operating in " + process.env.NODE_ENV + " mode");
console.log("MONGODB_URI_" + process.env.NODE_ENV.toUpperCase());
const connectionString = process.env["MONGODB_URI_" + process.env.NODE_ENV.toUpperCase()]!;
console.log("Connecting to " + connectionString);
let client = new MongoClient(connectionString);

client = await client.connect();
export const orders = client.db().collection<Order>("orders");
export const sources = client.db().collection<ManualSource | CustodialSource>("sources");
export const users = client.db().collection<User>("users");
console.log("Connected to database", orders.find({}).toArray());

export async function getUser(id: string) {
  return await users.findOne({ id });
}
export async function getUserByAddress(address: string) {
  return await users.findOne({ address });
}
export async function confirmUser(id: string) {
  return await users.updateOne({ id }, { $set: { confirmed: true } });
}

export async function createUser(
  address: string,
  sourceId?: string
): Promise<User & { _id: ObjectId }> {
  const user: User = { address, id: "uid_" + nanoid(), confirmed: false, sourceId };
  const insertion = await users.insertOne(user);
  return { _id: insertion.insertedId, ...user };
}

export async function getOrders(): Promise<Order[]> {
  const successfullOrders = (await orders
    .find({ $and: [{ status: "succeeded" }, { $or: [{ test: undefined }, { test: false }] }] })
    .toArray()) as WithId<Order>[];

  return successfullOrders;
}

export async function getFailedOrders(): Promise<Order[]> {
  const failedOrders = (await orders
    .find({ $or: [{ status: "failed" }, { status: "invalid hash" }] })
    .toArray()) as WithId<Order>[];

  return failedOrders;
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

export async function getSource(sid: string): Promise<CustodialSource | ManualSource | null> {
  const order = await sources.findOne({
    id: sid,
  });

  return order;
}

export async function getSourceIdByAddress(address: string) {
  const order = await sources.findOne({
    address,
  });

  return order?.id;
}

export async function getActiveSources() {
  const activeSources = await sources.find({ active: true }).toArray();

  return activeSources;
}

export async function updateStatus(pi: string, status: Order["status"]) {
  orders.updateOne({ paymentIntent: pi }, { $set: { status } });
}

export async function patchOrder(pi: string, patch: Partial<Order>) {
  orders.updateOne({ paymentIntent: pi }, { $set: patch });
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
    origin: URL,
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
