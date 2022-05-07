import { useEffect, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useStore } from "../utils/state";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/outline";
import { FullButton } from "./Button";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";

type Props =
  | {
      test: true;
      max: number;
      DEV_MODE: boolean;
      exchangeRate_USD_EUR: number;

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
      exchangeRate_USD_EUR: number;
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

export default function Form({
  offers,
  total,
  customers,
  max,
  exchangeRate_USD_EUR,
  DEV_MODE,
}: Props) {
  const [price, setPrice] = useState(1);
  const [selectedSource, setSource] = useState(0);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const router = useRouter();

  const validateStep = {
    0: () => address && address.match("ban_.{60}"),
    1: () => amount && amount >= 100,
    2: () => 0 <= selectedSource && selectedSource < offers.length,
    3: () => captcha,
  };

  const errorMessage = {
    0: "Please enter a valid wallet address",
    1: "Please enter an amount greater than 100 BAN",
    2: "Please select a source",
    3: "Please complete the captcha",
  };
  const { currency, test, setCurrency, setTest } = useStore();
  const currencySymbol = currency === "eur" ? "€" : "$";

  useEffect(() => {
    setPrice(
      amount
        ? amount * offers[selectedSource].rate * (currency === "eur" ? 1 : exchangeRate_USD_EUR)
        : 1
    );
  }, [amount, offers, selectedSource, exchangeRate_USD_EUR, currency]);
  function nextStep() {
    // @ts-expect-error Step can't be outside of range because of the division modulo step-length, but typescript doesn't know that
    if (validateStep[step]()) {
      // setError(null);
      step === 3 ? proceedToCheckout() : setStep((step + 1) % 4);
    } else {
      // @ts-expect-error
      toast.error(errorMessage[step]);
      // setError(errorMessage[step]);
      //  setTimeout(() => setError(null), 3000);
    }
  }
  async function proceedToCheckout() {
    const checkout = fetch("api/checkout", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        address,
        amount,
        source: offers[selectedSource].source_id,
        currency,
        test,
        "g-recaptcha-response": captcha,
      }),
    })
      .then((res) => res.json())
      .then((body) => router.push(body.message!))
      .catch((e) => console.error(e));
    toast.promise(checkout, {
      loading: "Redirecting to checkout...",
      success: "Successful",
      error: "Error when redirecting to checkout",
    });
  }

  return (
    <section className="bg-dark rounded-md shadow text-white h-[500px] p-5 relative flex flex-col justify-center text-base  sm:text-lg  md:text-xl">
      <Toaster position="top-right" />
      <div className="absolute left-4 top-4 flex ">
        <ChevronLeftIcon className="h-6 w-6" onClick={() => setStep(step > 0 ? step - 1 : 0)} />
        <ChevronRightIcon className="h-6 w-6" onClick={nextStep} />
      </div>
      <p className="absolute right-4 top-4 text-base t">Step: {step + 1} of 4 </p>
      <div onClick={nextStep} className="absolute right-4 bottom-4">
        <FullButton>{step === 3 ? "Checkout" : "Next"} </FullButton>
      </div>
      <p className=" absolute bottom-4 left-4">
        The current price is: <br />
        {test
          ? "0" + currencySymbol
          : `${price && price.toFixed(2) + currencySymbol} + 0,25${currencySymbol} Stripe fees`}
      </p>
      {offers && offers[0] ? (
        <form className="mt-5" action="/api/checkout" method="POST">
          {step === 0 && (
            <>
              <h4>What&apos;s your address?</h4>
              <label htmlFor="address">Enter the account we&apos;ll send your BAN to</label>
              <input
                className="w-full mt-2 p-2 border text-dark border-dark rounded-md"
                type="text"
                id="address"
                placeholder="ban_1224...."
                required
                onChange={(e) => setAddress(e.target.value)}
                value={address || ""}
                name="address"
                pattern="ban_.{60}"
              />
            </>
          )}
          {/* {step === 3 && (
            <>
               change to two buttons 
              <h4>Do you want to test the system?</h4>
              <label htmlFor="test">Test Mode: </label>
              <input
                onClick={() => useStore.setState((state) => ({ ...state, test: !state.test }))}
                className="mx-2 my-1"
                type="checkbox"
                id="test"
                name="test"
                checked={test}
                required
              />
            </>
           )}  */}
          {step === 1 && (
            <>
              <div>
                <h4>How much?</h4>
                <label htmlFor="amount">Enter your desired amount of BAN</label>
                <input
                  type="number"
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-2 p-2 border text-dark border-dark rounded-md"
                  id="amount"
                  placeholder="1000"
                  min="100"
                  value={amount || ""}
                  required
                  name="amount"
                  max={max ? max : 100000}
                />
              </div>
              <h4 className="mt-4">Which currency?</h4>
              <div className="mt-4">
                <button
                  type="button"
                  className={`${currency === "eur" ? "border-banano-600" : "border-white"} ${
                    currency === "eur" ? "text-banano-600" : "text-white"
                  }  border-2 text-base rounded-md p-3 mr-1`}
                  onClick={() => setCurrency("eur")}
                >
                  EUR
                </button>
                <button
                  type="button"
                  className={`${currency === "usd" ? "border-banano-600" : "border-white"} ${
                    currency === "usd" ? "text-banano-600" : "text-white"
                  }  border-2 text-base rounded-md p-3 mx-1`}
                  onClick={() => setCurrency("usd")}
                >
                  USD
                </button>
              </div>
              <input type="text" value={currency} name="currency" readOnly hidden />
            </>
          )}
          {step === 2 && (
            <>
              <h4>Select one of these sources: </h4>
              {offers
                .sort((a, b) => a.rate - b.rate)
                .map((source, index) => (
                  <button
                    type="button"
                    className={`${
                      index === selectedSource ? "border-banano-600" : "border-white"
                    } ${
                      index === selectedSource ? "text-banano-600" : "text-white"
                    }  border-2 text-base rounded-md p-3 my-2`}
                    key={source.source_id}
                    onClick={() => setSource(index)}
                  >
                    {source.name} offers up to {source.balance} BAN for{" "}
                    {((currency !== "eur" ? exchangeRate_USD_EUR : 1) * source.rate).toFixed(4)}{" "}
                    {currency.toUpperCase()}/BAN
                  </button>
                ))}
              <input
                type="text"
                name="source"
                value={offers[selectedSource].source_id}
                hidden
                readOnly
              />
            </>
          )}
          {step === 3 && (
            <>
              <h4>Real money or just testing?</h4>
              <div className="my-4">
                <button
                  type="button"
                  className={`${!test ? "border-banano-600" : "border-white"} ${
                    !test ? "text-banano-600" : "text-white"
                  }  border-2 text-base rounded-md p-3 mr-1`}
                  onClick={() => setTest(false)}
                >
                  Real
                </button>
                <button
                  type="button"
                  className={`${test ? "border-banano-600" : "border-white"} ${
                    test ? "text-banano-600" : "text-white"
                  }  border-2 text-base rounded-md p-3 mx-1`}
                  onClick={() => setTest(true)}
                >
                  Test
                </button>
              </div>
              <h4>Are you human?</h4>
              <ReCAPTCHA
                className="my-5"
                sitekey="6Lc80lofAAAAAPHm6vZA4AcKTuikKCfLYkSe7Ajc"
                onChange={(token) => (token ? setCaptcha(token) : setCaptcha(null))}
              />
            </>
          )}
        </form>
      ) : (
        <p>There are currently no offers to display :( </p>
      )}
    </section>
  );
}
