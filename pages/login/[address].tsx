import { withIronSessionSsr } from "iron-session/next";
import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import Layout from "../../components/Layout";
import { ironOptions } from "../../utils/auth";
import getDB from "../../utils/db";
//@ts-ignore
export const getServerSideProps = withIronSessionSsr(login, ironOptions);

async function login({ req, query }: NextPageContext) {
  const db = await getDB();
  if (req && req.session.user) {
    return { redirect: { permanent: false, destination: "/dashboard" } };
  }
  const { address } = query;
  const user = await db.getUserByAddress(address as string);
  user || db.createUser(address as string);

  return {
    props: {
      sendingAddress: address as string,
      receivingAddress: process.env.ADDRESS!,
    },
  };
}

export default function Login({
  sendingAddress,
  receivingAddress,
}: {
  sendingAddress: string;
  receivingAddress: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const submitResonse = async () => {
    const res = await fetch("/api/login/?address=" + sendingAddress);
    const body: { ok: boolean; error: string } = await res.json();
    console.log(res);
    if (body.ok) {
      router.push("/dashboard");
    } else {
      setError(body.error || "Error");
    }
  };
  return (
    <Layout>
      <main className="text-lg text-dark mt-10 md:grid mx-auto max-w-4xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
        <h1 className="mb-10 mt-20 text-4xl tracking-tight font-extrabold  sm:text-5xl md:text-6xl">
          Verify your ownership
        </h1>
        <br />
        <p className="mb-6">
          To verify your ownership of the account please send 0.01 BAN (1 Banoshi) to{" "}
          <b>{receivingAddress}</b>. It will be returned immidiately.
        </p>

        <QRCodeSVG value={"ban:" + receivingAddress + "?amount=1000000000000000000000000000"} />
        <br />
        <button
          className=" flex items-center w-52 mt-4 justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-dark bg-banano-600 hover:bg-banano-700 md:py-4 md:text-lg md:px-10"
          onClick={submitResonse}
        >
          I sent the BAN
        </button>
        {error && <p>{error}</p>}
      </main>
    </Layout>
  );
}
