import create from "zustand";

interface State {
  currency: string;
  test: boolean;
  toggleCurrency: () => void;
  setCurrency: (currency: string) => void;
  setTest: (test: boolean) => void;
}

export const useStore = create<State>()((set) => ({
  currency: "eur",
  test: false,
  toggleCurrency: () => set((state) => ({ currency: state.currency === "eur" ? "usd" : "eur" })),
  setCurrency: (currency) => set(() => ({ currency })),
  setTest: (test) => set(() => ({ test })),
}));
