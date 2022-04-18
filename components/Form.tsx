import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

type Props =
  | { test: true; price?: never; updatePrice?: never; max?: number; DEV_MODE: boolean }
  | { test?: false; price: number; updatePrice: Function; max: number; DEV_MODE: boolean };

export default function Form({ test = false, price, updatePrice, max, DEV_MODE }: Props) {
  const [isCaptchaCompleted, setIsCaptchaCompleted] = useState(false);

  return (
    <form className="mt-5" action="/api/checkout" method="POST">
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
      <label htmlFor="amount">Enter your desired amount of BAN</label>
      <input
        type="number"
        onChange={(e) => test || (updatePrice && updatePrice(e.target.value))}
        id="amount"
        placeholder="1000"
        min="100"
        required
        name="amount"
        max={max ? max : 100000}
      />
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
      <p className="price">
        The current price is: {test ? "0€" : `${price && price.toFixed(2)}€ + 0,25€ Stripe fees`}
      </p>
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
