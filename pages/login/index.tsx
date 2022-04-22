import Link from "next/link";
import { useState } from "react";
import Layout from "../../components/Layout";

export default function Login() {
  const [address, setAddress] = useState("");
  return (
    <Layout>
      <h1>Login to your account</h1>
      <p>Enter the address associated with your account</p>
      <label htmlFor="address">Address</label>
      <input
        onChange={(e) => setAddress(e.target.value)}
        required
        type="text"
        id="address"
        value={address}
      />
      <p>
        In our model, every address is one account which can be verified by signing transactions.
      </p>
      <br />
      <Link passHref href={"/login/" + address}>
        <button>Login</button>
      </Link>
    </Layout>
  );
}
