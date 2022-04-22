import { withIronSessionSsr } from "iron-session/next";
import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { ironOptions } from "../../utils/auth";
import { createUser, getUserByAddress } from "../../utils/db";
//@ts-ignore
export const getServerSideProps = withIronSessionSsr(login, ironOptions);

async function login({ req, query }: NextPageContext) {
  if (req && req.session.user) {
    return { redirect: { permanent: false, destination: "/dashboard" } };
  }
  const { address } = query;
  const user = await getUserByAddress(address as string);
  user || createUser(address as string);

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
    }

    setError(body.error || "Error");
  };
  return (
    <Layout>
      <h1>Verify your ownership</h1>
      <br />
      <p>
        To verify your ownership of the account please send 0.01 BAN to <b>{receivingAddress}</b>.
        It will be returned immidiately.
      </p>
      <br />
      <QRCodeSVG value={"ban:" + receivingAddress + "?amount=1000000000000000000000000000"} />
      <br />
      <button onClick={submitResonse}>I sent the BAN</button>
      {error && <p>{error}</p>}
    </Layout>
  );
}
