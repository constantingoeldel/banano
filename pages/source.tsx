import { useState } from "react";
import { ChainToggle } from "../components/Toggle";
import { useStore } from "../utils/state";
export default function Source() {
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"custodial" | "manual">("custodial");
  const [market, setMarket] = useState(true);
  const chain = useStore((state) => state.chain);
  return (
    <>
      <h1 className="mb-10 text-4xl tracking-tight font-extrabold  sm:text-5xl md:text-6xl">
        Offer your Banano on the marketplace
      </h1>
      <p>
        Do you want to sell your {chain.toUpperCase()} to other enthusiasts? You can easily do so by
        signing up for a merchant account and selecting a way to fulfill the orders that you
        receive:
      </p>
      <h2 className="my-5 text-2xl tracking-tight font-extrabold  sm:text-2xl md:text-3xl">
        Here is how it works:{" "}
      </h2>
      <ol>
        <li>1. Choose how to represent yourself to customers</li>
        <li>2. Select a way to fulfill the orders that you receive</li>
        <li>3. Register for a seller-account</li>
        <li>4. Start selling your {chain.toUpperCase()}</li>
        <li>5. Receive payouts to your Bank Account</li>
      </ol>
      <form action="/api/create">
        <h2 className="my-5 text-2xl tracking-tight font-extrabold  sm:text-2xl md:text-3xl">
          Tell us about yourself:
        </h2>
        <label className="block  font-medium text-gray-700">
          Name we show to customers:
          <input
            className="my-4 relative  shadow-sm focus:ring-banano-600 focus:border-banano-600 block w-1/2  sm:text-sm border-gray-300 rounded-md"
            required
            type="text"
            name="name"
          />
        </label>
        <label className="block  font-medium text-gray-700">
          Email to contact you through:
          <input
            required
            className="my-4 relative  shadow-sm focus:ring-banano-600 focus:border-banano-600 block w-1/2  sm:text-sm border-gray-300 rounded-md"
            type="email"
            name="email"
          />
        </label>
        <br />

        <p>Chain to use:</p>
        <div className="-translate-y-[0.4rem] ml-28">
          <ChainToggle />
        </div>
        <input name="chain" value={chain} hidden readOnly />

        <h2 className="my-5 mt-10 text-2xl tracking-tight font-extrabold  sm:text-2xl md:text-3xl">
          Select a fulfillment method:
        </h2>
        <ul>
          <li>
            <b>The easy way:</b> We set up a custodial wallet which you sent the{" "}
            {chain.toUpperCase()} you want to sell to. No setup neccessary but you need to trust
            this platform not to steal from you.
          </li>
          <br />
          <li>
            <b>The full-control way:</b> You set up a server that handles offer creation and sending
            the {chain.toUpperCase()} to the customer. You remain in full-control over your funds.
            We provide tutorials to set up the server quickly.
          </li>
        </ul>
        <br />
        <input
          onClick={() => setFulfillmentMethod("custodial")}
          required
          className="-mt-1"
          id="custodial"
          name="method"
          type="radio"
          value="custodial"
        />
        <label className="ml-2" htmlFor="custodial">
          Custodial
        </label>
        <input
          onClick={() => setFulfillmentMethod("manual")}
          required
          className="ml-4 -mt-1"
          id="manual"
          name="method"
          type="radio"
          value="manual"
        />

        <label htmlFor="manual" className="ml-2">
          Self-Host
        </label>
        {fulfillmentMethod === "custodial" ? (
          <>
            <h2 className="my-5 text-2xl tracking-tight font-extrabold  sm:text-2xl md:text-3xl">
              Selling price:
            </h2>
            <p>
              You can set a minimum price to sell your {chain.toUpperCase()} at and/or choose to
              follow the market price &#177; a margin
            </p>

            <label>
              Minimum price in cents per {chain.toUpperCase()} :
              <input
                required
                className="mt-4 relative  shadow-sm focus:ring-banano-600 focus:border-banano-600 block   sm:text-sm border-gray-300 rounded-md"
                type="number"
                name="min"
                defaultValue={0}
              />
            </label>

            <br />

            <p>Follow the market price:</p>
            <div className="scale-[25%] block -ml-[11rem] -mt-[4.6rem]">
              <input
                onChange={() => setMarket(!market)}
                type="checkbox"
                required
                id="toggle-market"
                checked={market}
              />
              <label className="toggle" htmlFor="toggle-market"></label>
              <input name="market" type="checkbox" checked={market} hidden readOnly />
            </div>
            {market && (
              <label>
                Margin (in %): 100 is exactly the market price, 50 would be 50% below the market
                price, 150 would be 50% above the market price
                <input
                  required
                  type="number"
                  name="margin"
                  defaultValue={100}
                  min="0"
                  className="my-4 relative  shadow-sm focus:ring-banano-600 focus:border-banano-600 block  sm:text-sm border-gray-300 rounded-md"
                  max="1000"
                />
              </label>
            )}
          </>
        ) : (
          <>
            <h2 className="my-5 text-2xl tracking-tight font-extrabold  sm:text-2xl md:text-3xl">
              Server information:
            </h2>
            <p>
              We need to make a GET request to receive your latest balance and {chain.toUpperCase()}{" "}
              rate as well as a POST request as soon as the users pays. For information on how to
              set up the server, see <a href="/setup">our documentation.</a>
            </p>
            <br />
            <label htmlFor="webhook">Webhook address:</label>
            <input
              className="my-4 relative  shadow-sm focus:ring-banano-600 focus:border-banano-600 block w-full  sm:text-sm border-gray-300 rounded-md"
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
        <button
          type="submit"
          className=" flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-dark bg-banano-600 hover:bg-banano-700 md:py-4 md:text-lg md:px-10"
        >
          Next
        </button>
      </form>
    </>
  );
}
