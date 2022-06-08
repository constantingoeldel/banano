import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { Purchase } from "../../types";
import getDB from "../../utils/db";

export default withApiAuthRequired(async (req, res) => {
  if (req.method === "PATCH") {
    const session = getSession(req, res);
    if (!session) {
      res.status(401).send("Not authenticated");
      return;
    }
    const db = await getDB();
    const { user } = session;
    const { addresses } = JSON.parse(req.body);
    for (const address of addresses) {
      if (!(address.match(/^ban_[A-Za-z0-9]{60}$/g) || address.match(/^nano_[A-Za-z0-9]{60}$/g))) {
        res.status(400).send("Invalid address");
        return;
      }
    }
    db.updateUser(user.sub, { addresses });
    const history = await purchaseHistory(addresses);
    res.status(200).json(history);
  }
});

export async function purchaseHistory(
  addresses: string[]
): Promise<{ purchases: Purchase[]; total: { ban: number; eur: number; usd: number } }> {
  const db = await getDB();
  const orders = await db.getAddressOrders(addresses);
  console.log(orders);

  const purchase: Purchase[] = orders.map((order) => {
    return {
      id: order.paymentIntent,
      timestamp: order.timestamp,
      address: order.address,
      amount: order.amount,
      price: order.price,
      currency: order.currency || "eur",
      chain: order.chain || "banano",
      status: order.status,
      hash: order.hash || "No hash yet",
      test: order.test || false,
    };
  });

  return {
    total: {
      ban: orders
        .filter((order) => order.status === "succeeded")
        .reduce((sum, order) => (sum += order.amount), 0),
      eur:
        orders
          .filter((order) => order.status === "succeeded" && order.currency === "eur")
          .reduce((sum, order) => (sum += order.amount !== 0.01 ? order.price : 0), 0) / 100,

      usd:
        orders
          .filter((order) => order.status === "succeeded" && order.currency === "usd")
          .reduce((sum, order) => (sum += order.amount !== 0.01 ? order.price : 0), 0) / 100,
    },

    purchases: purchase,
  };
}
