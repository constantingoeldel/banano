import { useEffect, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useStore } from "../utils/state";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/outline";
import { FullButton } from "./Button";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";
import { Offer, Source } from "../types";

interface Props {
  exchangeRate_USD_EUR?: number;
  offers?: Offer[];
}

export default function Form({ offers, exchangeRate_USD_EUR = 1 }: Props) {
  // limit amount
  const [price, setPrice] = useState(0);
  const [selectedOffer, setOffer] = useState<Offer | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const { currency, test, setCurrency, setTest, chain } = useStore();
  const currencySymbol = currency === "eur" ? "€" : "$";
  const router = useRouter();

  const unsubChain = useStore.subscribe(
    (state) => state.chain,
    () => setStep(0)
  );

  const validateStep = {
    0: () =>
      address && (chain === "banano" ? address.match("ban_.{60}") : address.match("nano_.{60}")),
    1: () => selectedOffer,
    2: () =>
      selectedOffer &&
      amount &&
      amount >= (chain === "banano" ? 100 : 1) &&
      amount <= selectedOffer.balance,
    3: () => captcha,
  };

  const errorMessage = {
    0: "Please enter a valid wallet address",
    1: offers ? "Please select a source" : "No offers available. Please come back later",
    2:
      "Please enter an amount greater than " +
      (chain === "banano" ? "100 BAN" : "1 XNO") +
      " and lower than the sources availability",
    // (offers ? offers[selectedSource].balance.toFixed(0) : "1000")
    3: "Please complete the captcha",
  };

  useEffect(() => {
    setPrice(
      amount && selectedOffer
        ? amount * selectedOffer.rate * (currency === "eur" ? 1 : exchangeRate_USD_EUR)
        : 0
    );
  }, [amount, offers, selectedOffer, exchangeRate_USD_EUR, currency]);
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
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        address,
        amount,
        // @ts-ignore
        source: selectedOffer.source_id,
        currency,
        test,
        chain,
        "g-recaptcha-response": captcha,
      }),
    })
      .then((res) => res.json())
      .then((body: { message: string }) => {
        body.message.includes("https://checkout.stripe.com/pay/")
          ? router.push(body.message!)
          : toast.error(body.message);
      })
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

      <div className=" absolute bottom-4 left-4">
        {selectedOffer && amount && (
          <p>
            The current price is: <br />
            {test
              ? "0" + currencySymbol
              : `${price.toFixed(2) + currencySymbol} + 0.25${currencySymbol} Stripe fees`}
          </p>
        )}
      </div>

      {
        <form
          className="mt-5"
          action="/api/checkout"
          method="POST"
          onSubmit={(e) => e.preventDefault()}
        >
          {step === 0 && (
            <>
              <h4>What&apos;s your address?</h4>
              <label htmlFor="address">
                Enter the account we&apos;ll send your {chain.toLocaleUpperCase()} to
              </label>
              <input
                className="w-full mt-2 p-2 border text-dark border-dark rounded-md"
                type="text"
                id="address"
                placeholder={chain === "banano" ? "ban_1224...." : "nano_1224...."}
                required
                onChange={(e) => setAddress(e.target.value)}
                value={address || ""}
                name="address"
              />
            </>
          )}

          {step === 1 && (
            <>
              <h4>Select one of these sources: </h4>
              {offers && offers.find((o) => o.chain === chain) ? (
                <>
                  {offers
                    .filter((o) => o.chain === chain)
                    .sort((a, b) => a.rate - b.rate)
                    .map((source) => (
                      <button
                        type="button"
                        className={`${
                          source.offer_id === selectedOffer?.offer_id
                            ? "border-banano-600"
                            : "border-white"
                        } ${
                          source.offer_id === selectedOffer?.offer_id
                            ? "text-banano-600"
                            : "text-white"
                        }  border-2 text-base rounded-md p-3 my-2`}
                        key={source.source_id}
                        onClick={() => setOffer(source)}
                      >
                        {source.name} offers up to {source.balance} {chain.toUpperCase()} for{" "}
                        {((currency !== "eur" ? exchangeRate_USD_EUR : 1) * source.rate).toFixed(4)}{" "}
                        {currency.toUpperCase()}/{chain.toUpperCase()}
                      </button>
                    ))}
                  <input
                    type="text"
                    name="source"
                    value={selectedOffer?.source_id}
                    hidden
                    readOnly
                  />
                </>
              ) : (
                <p>Everything sold out, please come back later</p>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <h4>How much?</h4>
                <label htmlFor="amount">Enter your desired amount of {chain.toUpperCase()}</label>
                <input
                  type="number"
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-2 p-2 border text-dark border-dark rounded-md"
                  id="amount"
                  placeholder="1000"
                  min={chain === "banano" ? 100 : 1}
                  value={amount || ""}
                  required
                  name="amount"
                  // @ts-ignore - can't be reached when offers don't exist
                  max={selectedOffer.balance}
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
              <input type="text" value={chain} name="chain" readOnly hidden />
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
      }
    </section>
  );
}
