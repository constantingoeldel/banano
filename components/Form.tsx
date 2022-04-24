import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

type Props =
  | {
      test: true;
      price?: never;
      updatePrice?: never;
      max?: number;
      DEV_MODE: boolean;
      offers: {
        offer_id: string;
        source_id: string;
        name: string;
        balance: number;
        rate: number;
      }[];
      total: number;
      customers: number;
    }
  | {
      test?: false;
      max: number;
      DEV_MODE: boolean;
      offers: {
        offer_id: string;
        source_id: string;
        name: string;
        balance: number;
        rate: number;
      }[];
      total: number;
      customers: number;
    };

export default function Form({ test = false, offers, total, customers, max, DEV_MODE }: Props) {
  const [price, setPrice] = useState(1);
  const [selectedSource, setSource] = useState(0);
  const [isCaptchaCompleted, setIsCaptchaCompleted] = useState(false);
  function updatePrice(amount: string) {
    setPrice(Number(amount) * offers[selectedSource].rate);
  }

  return (
    <form className="mt-5" action="/api/checkout" method="POST">
      <p className="total">
        So far, {total} BAN have been purchased by {customers} people. {max} BAN are available.{" "}
        <b className="rate">
          The current best rate is:{" "}
          {offers
            .reduce(
              (lowest, source) => (lowest = source.rate < lowest ? source.rate : lowest),
              offers[0].rate
            )
            .toFixed(2)}{" "}
          EUR/BAN{" "}
        </b>
      </p>
      <h2>Select one of these sources: </h2>
      {offers.map((source, index) => (
        <button
          className={selectedSource === index ? "bg-[#fbdd11]" : ""}
          key={source.source_id}
          onClick={() => setSource(index)}
        >
          {source.name} offers up to {source.balance} BAN for {source.rate.toFixed(4)} EUR/BAN
        </button>
      ))}
      <br />
      <label htmlFor="address">What address should I send your BAN to?</label>
      <input
        className="w-2/3"
        type="text"
        id="address"
        placeholder="ban_1224...."
        required
        name="address"
        pattern="ban_.{60}"
      />
      <input type="text" name="source" value={offers[selectedSource].source_id} hidden readOnly />
      <div className={test ? "hidden" : ""}>
        <label htmlFor="amount">Enter your desired amount of BAN</label>
        <input
          type="number"
          onChange={(e) => test || (updatePrice && updatePrice(e.target.value))}
          id="amount"
          placeholder="1000"
          min="100"
          defaultValue={100}
          required
          name="amount"
          max={max ? max : 100000}
        />
      </div>
      {test && (
        <>
          <label htmlFor="test">Test Mode: </label>
          <input
            className="mx-2 my-1"
            type="checkbox"
            id="test"
            name="test"
            defaultChecked
            required
          />
        </>
      )}
      {test || (
        <p className="price">
          The current price is: {test ? "0€" : `${price && price.toFixed(2)}€ + 0,25€ Stripe fees`}
        </p>
      )}
      <ReCAPTCHA
        className="my-5"
        sitekey="6Lc80lofAAAAAPHm6vZA4AcKTuikKCfLYkSe7Ajc"
        onChange={() => setIsCaptchaCompleted(true)}
      />

      <button
        disabled={!(!!DEV_MODE || isCaptchaCompleted)}
        type="submit"
        className="bg-[#fbdd11]"
        id="checkout-button"
      >
        {test ? "Test" : "Checkout"}
      </button>
    </form>
  );
}
