export type Status = {
  total: number;
  status: "good" | "bad";
  customers: number;
  offers: {
    offer_id: string;
    source_id: string;
    name: string;
    balance: number;
    rate: number;
  }[];
  max: number;
};

export interface User {
  id: string;
  address: string;
  passwordHash: string;
}

export interface Offer {
  offer_id: string;
  source_id: string;
  name: string;
  balance: number;
  rate: number;
}

export interface OfferResponse {
  balance: number;
  rate: number;
}

export interface Source {
  email: string;
  id: string;
  active: boolean;
  name: string;
  secret: string;
  account: string;
}

export interface ManualSource extends Source {
  custodial: false;
  webhook: string;
}

export interface Price {
  min: number;
  market: boolean;
  margin: number;
}

export interface CustodialSource extends Source {
  custodial: true;
  address: string;
  seed: string;
  price: Price;
}

export interface Order {
  timestamp: number;
  address: string;
  paymentIntent: string;
  amount: number;
  price: number;
  status: "open" | "successful" | "failed" | "invalid hash";
  test: boolean;
  source: CustodialSource | ManualSource;
  transferGroup: string;
  offer: Offer;
}

interface Block {
  block_account: string;
  amount: number;
  balance: number;
  height: number;
  local_timestamp: number;
  confirmed: boolean;
  contents: {
    type: string;
    account: string;
    previous: string;
    representative: string;
    balance: number;
    link: string;
    link_as_account: string;
    signature: string;
    work: string;
    subtype: string;
  };
  subtype: string;
  pending: number;
  source_account: number;
}

declare module "@bananocoin/bananojs";
