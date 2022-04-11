import Link from "next/link";
import Form from "../components/Form";
import Layout from "../components/Layout";

export default function Test() {
  return (
    <Layout>
      <h1>Test buying Banano with fiat</h1>
      <p>
        If you want to test the website before spending any real money, you can do it here. Just
        enter the fake credit card below. This is an early prototype, so thank you for your trust
        and if there are any issues, you can write me on Discord: Consti#9536.{" "}
        <Link href="video">
          <a>Check this video to see how it works</a>
        </Link>
      </p>
      <br />
      <p>
        Number: <b>4242 4242 4242 4242</b> <br />
        CVC: Any 3 digits
        <br />
        Date: Any future date
      </p>
      <br />
      <p>Then you will get 0.1 BAN sent to your wallet</p>

      <Form test={true} />
    </Layout>
  );
}
