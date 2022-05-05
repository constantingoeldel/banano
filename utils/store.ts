import create from "zustand";
import { getRateEUR, getRateUSD } from "./banano";

interface State {
  currency: string;
}

export const useStore = create<State>()(() => ({
  currency: "eur",
  exchangeRate_USD_EUR: 1,
}));
