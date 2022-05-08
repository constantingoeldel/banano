import create from "zustand";

interface State {
  currency: string;
  test: boolean;
  chain: "banano" | "nano";
  toggleCurrency: () => void;
  toggleChain: () => void;
  setCurrency: (currency: string) => void;
  setTest: (test: boolean) => void;
}

export const useStore = create<State>()((set) => ({
  currency: "eur",
  test: false,
  chain: "banano",
  toggleCurrency: () => set((state) => ({ currency: state.currency === "eur" ? "usd" : "eur" })),
  toggleChain: () => set((state) => ({ chain: state.chain === "banano" ? "nano" : "banano" })),
  setCurrency: (currency) => set(() => ({ currency })),
  setTest: (test) => set(() => ({ test })),
}));
