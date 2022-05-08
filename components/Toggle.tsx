import { useStore } from "../utils/state";

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useStore();

  return (
    <div className="flex items-center -my-14 mx-4  ">
      <p className="-mr-14">EUR</p>
      <div className="scale-[25%]">
        <input
          onChange={toggleCurrency}
          type="checkbox"
          id="toggle-currency"
          checked={currency === "usd"}
        />
        <label className="toggle" htmlFor="toggle-currency"></label>
      </div>
      <p className="-ml-14">USD</p>
    </div>
  );
}
export function ChainToggle() {
  const { chain, toggleChain } = useStore();

  return (
    <div className="flex items-center -my-14 mx-4  ">
      <p className="-mr-14">BANANO</p>
      <div className="scale-[25%]">
        <input
          onChange={toggleChain}
          type="checkbox"
          id="toggle-currency"
          checked={chain === "nano"}
        />
        <label className="toggle" htmlFor="toggle-currency"></label>
      </div>
      <p className="-ml-14">NANO</p>
    </div>
  );
}
