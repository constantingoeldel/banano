import { useState } from "react";
import Layout from "../components/Layout";

export default function Source() {
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"custodial" | "manual">("custodial");
  const [market, setMarket] = useState(true);
  return (
    <Layout>
      <h1>Offer your Banano on the marketplace</h1>
      <p>
        Do you want to sell your BAN to other Potassium-enthusiasts? You can easily do so by signing
        up for a merchant account and selecting a way to fulfill the orders that you receive:
      </p>
      <h2>Here is how it works: </h2>
      <ol>
        <li>1. Choose how to represent yourself to customers</li>
        <li>2. Select a way to fulfill the orders that you receive</li>
        <li>3. Register for a seller-account</li>
        <li>4. Start selling your BAN</li>
        <li>5. Receive payouts to your Bank Account</li>
      </ol>
      <form action="/api/create">
        <h2>Tell us about yourself:</h2>
        <label>
          Name we show to customers:
          <input className="w-60" required type="text" name="name" />
        </label>
        <label>
          Email to contact you through:
          <input required className="w-60" type="email" name="email" />
        </label>
        <label></label>
        <h2>Select a fulfillment method:</h2>
        <ul>
          <li>
            <b>The easy way:</b> We set up a custodial wallet which you sent the BAN you want to
            sell to. No setup neccessary but you need to trust this platform to not steal your BAN.
          </li>
          <br />
          <li>
            <b>The full-control way:</b> You set up a server that handles offer creation and sending
            the BAN to the customer. You remain in full-control over your funds. We provide
            tutorials to set up the server quickly.
          </li>
        </ul>
        <br />
        <input
          onClick={() => setFulfillmentMethod("custodial")}
          required
          id="custodial"
          name="method"
          type="radio"
          value="custodial"
        />
        <label className="-mt-2" htmlFor="custodial">
          Custodial
        </label>
        <input
          onClick={() => setFulfillmentMethod("manual")}
          required
          className="ml-4"
          id="manual"
          name="method"
          type="radio"
          value="manual"
        />

        <label htmlFor="manual" className="-mt-2">
          Self-Host
        </label>
        {fulfillmentMethod === "custodial" ? (
          <>
            <h2>Selling price:</h2>
            <p>
              You can set a minimum price to sell your BAN at and/or choose to follow the market
              price &#177; a margin
            </p>

            <label>
              Minimum price in cents per BAN (Market currently around 2ct.):
              <input required type="number" name="min" defaultValue={0} />
            </label>

            <br />
            <label>
              Follow the market price:
              <input
                onChange={() => setMarket(!market)}
                className="ml-2 mt-1"
                required
                type="checkbox"
                name="market"
                checked={market}
              />
            </label>
            {market && (
              <label>
                Margin (in %): 100 is exactly the market price, 50 would be 50% below the market
                price, 150 would be 50% above the market price
                <input required type="number" name="margin" defaultValue={100} min="0" max="1000" />
              </label>
            )}
          </>
        ) : (
          <>
            <h2>Server information:</h2>
            <p>
              We need to make a GET request to receive your latest balance and BAN rate as well as a
              POST request as soon as the users pays. For information on how to set up the server,
              see <a href="/setup">our documentation.</a>
            </p>
            <br />
            <label htmlFor="webhook">Webhook address:</label>
            <input
              className="w-full"
              placeholder="https://example.com/api/webhook"
              required
              id="webhook"
              type="url"
              name="webhook"
              pattern="/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/"
            />
          </>
        )}
        <br />
        <button type="submit" className="bg-[#fbdd11]">
          Next
        </button>
      </form>
    </Layout>
  );
}
