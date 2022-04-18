import Layout from "../../components/Layout";
import { getUser, getUserOrders } from "../../utils/db";

export async function serverSideProps({ req, res }) {
  const user = await getUser(req.query.user);
  const orders = await getUserOrders(user.address);
  return {
    props: {
      address: user.address,
      total: {
        ban: orders.reduce((sum, order) => (sum += order.amount), 0),
        eur: orders.reduce((sum, order) => (sum += order.price), 0),
      },
      purchases: orders,
    },
  };
}

interface Dashboard {
  address: string;
  total: {
    ban: number;
    eur: number;
  };

  purchases: {
    amount: number;
    price: number;
    timestamp: number;
    id: string;
    hash: string;
    status: string;
  }[];
}

export default function Dashboard({ address, total, purchases }: Dashboard) {
  return (
    <Layout>
      <main>
        <h1>Dashboard</h1>
        <p>Hello, human! Here you can see your account details and past pruchases</p>
        <br />
        <p>
          The address associated to your account is: <b>{address}</b>
        </p>
        <p>
          So far, you have purchased {total.ban} BAN for {total.eur}€
        </p>
        <h2>Purchase history</h2>
        {purchases.map((purchase) => {
          <div key={purchase.id} className="bg-green-300 p-3 m-5 rounded">
            <p>On {new Date(purchase.timestamp).toLocaleDateString()}:</p>
            <p>
              {purchase.amount} BAN for {purchase.price} EUR
            </p>
            <p>Status: {purchase.status}</p>
            <p>Transaction hash: {purchase.hash}</p>
          </div>;
        })}
      </main>
    </Layout>
  );
}
