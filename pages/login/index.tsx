import Link from "next/link";
import { useState } from "react";
import Layout from "../../components/Layout";

export default function Login() {
  const [address, setAddress] = useState("");
  return (
    <Layout>
      <main className="text-lg text-dark mt-10 md:grid mx-auto max-w-4xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
        <h1 className="mb-10 mt-20 text-4xl tracking-tight font-extrabold  sm:text-5xl md:text-6xl">
          Login to your account
        </h1>
        <p>
          Enter your wallet address. If you just registered as a seller, you will receive it
          shortly.
        </p>
        <label htmlFor="address">Address:</label>
        <input
          className="my-4 relative  shadow-sm focus:ring-banano-600 focus:border-banano-600 block w-full  sm:text-sm border-gray-300 rounded-md"
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
          <button className=" flex items-center w-32 mt-4 justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-dark bg-banano-600 hover:bg-banano-700 md:py-4 md:text-lg md:px-10">
            Login
          </button>
        </Link>
      </main>
    </Layout>
  );
}
