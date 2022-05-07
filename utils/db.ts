import { Collection, MongoClient, ObjectId, WithId } from "mongodb";
import { CustodialSource, ManualSource, Offer, Order, Source, User } from "../types";
import { nanoid } from "nanoid";
import { DatabaseError, ServerError } from "./errors";

export class Database {
  client: MongoClient;
  connected: boolean;
  sources: WithId<CustodialSource | ManualSource>[] | null;
  lastSources: number | null;

  constructor() {
    console.log("Operating in " + process.env.NODE_ENV + " mode");
    const connectionString = process.env["MONGODB_URI_" + process.env.NODE_ENV.toUpperCase()]!;
    this.client = new MongoClient(connectionString);
    this.connected = false;
    this.sources = null;
    this.lastSources = null;
  }
  async connect() {
    if (this.connected) {
      return this;
    }

    try {
      this.client = await this.client.connect();
      await this.client.db("admin").command({ ping: 1 });
      console.log("Connected successfully to server");
      this.connected = true;
      return this;
    } catch (e) {
      console.log("Failed to connect to server");
      throw new ServerError("Failed to connect to server");
    }
  }

  async getUser(id: string) {
    return await this.client.db().collection<User>("users").findOne({ id });
  }
  async getUserByAddress(address: string) {
    return await this.client.db().collection<User>("users").findOne({ address });
  }
  async confirmUser(id: string) {
    return await this.client
      .db()
      .collection<User>("users")
      .updateOne({ id }, { $set: { confirmed: true } });
  }

  async createUser(address: string, sourceId?: string): Promise<User & { _id: ObjectId }> {
    const user: User = { address, id: "uid_" + nanoid(), confirmed: false, sourceId };
    const insertion = await this.client.db().collection<User>("users").insertOne(user);
    return { _id: insertion.insertedId, ...user };
  }

  async getOrders(): Promise<Order[]> {
    await this.connect();
    const successfullOrders = await this.client
      .db()
      .collection<Order>("orders")
      .find({ status: "succeeded" })
      .toArray();
    console.log("Found " + successfullOrders.length + " orders");
    return successfullOrders;
  }

  async getFailedOrders(): Promise<Order[]> {
    const failedOrders = (await this.client
      .db()
      .collection<Order>("orders")
      .find({ $or: [{ status: "failed" }, { status: "invalid hash" }] })
      .toArray()) as WithId<Order>[];

    return failedOrders;
  }

  async getUserOrders(address: string) {
    return (await this.client
      .db()
      .collection<Order>("orders")
      .find({ address: address })
      .toArray()) as WithId<Order>[];
  }

  async getOrder(pi: string) {
    const order = await this.client.db().collection<Order>("orders").findOne<WithId<Order>>({
      paymentIntent: pi,
    });
    if (!order) {
      throw new DatabaseError("Order " + pi + " not found");
    }
    return order;
  }

  async getSource(sid: string): Promise<CustodialSource | ManualSource | null> {
    const source = await this.client
      .db()
      .collection<CustodialSource | ManualSource>("sources")
      .findOne({
        id: sid,
      });

    return source;
  }

  async getSourceIdByAddress(address: string) {
    const order = await this.client
      .db()
      .collection<CustodialSource | ManualSource>("sources")
      .findOne({
        address,
      });

    return order?.id;
  }

  async getActiveSources(allowStale: boolean = false) {
    if (
      allowStale &&
      this.sources &&
      this.lastSources &&
      this.lastSources - Date.now() < 1000 * 60 * 60
    ) {
      return this.sources;
    } else {
      this.sources = await this.client
        .db()
        .collection<CustodialSource | ManualSource>("sources")
        .find({ active: true })
        .toArray();

      this.lastSources = Date.now();
      return this.sources;
    }
  }

  async updateStatus(pi: string, status: Order["status"]) {
    this.client
      .db()
      .collection<Order>("orders")
      .updateOne({ paymentIntent: pi }, { $set: { status } });
  }

  async patchOrder(pi: string, patch: Partial<Order>) {
    this.client.db().collection<Order>("orders").updateOne({ paymentIntent: pi }, { $set: patch });
  }

  async addOrder(
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
      version: process.env.VERSION || "0.0.0",
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
    const { insertedId } = await this.client.db().collection<Order>("orders").insertOne(order);
    return insertedId;
  }

  async addSource(source: ManualSource | CustodialSource) {
    const { insertedId } = await this.client
      .db()
      .collection<CustodialSource | ManualSource>("sources")
      .insertOne(source);
    return insertedId;
  }
  async addError(paymentIntent: string, error: string) {
    this.client.db().collection("errors").insertOne({ paymentIntent, error: error });
  }
}

let db: Database | null = null;
export default async function getDB(): Promise<Database> {
  if (!db) {
    db = await new Database().connect();
  }
  return db;
}
