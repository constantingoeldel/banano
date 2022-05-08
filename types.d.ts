export type Status = {
  total: number;
  status: "good" | "bad";
  customers: number;
  offers?: Offer[];
  max: number;
  exchangeRate: number;
};

export interface User {
  id: string;
  address: string;
  confirmed: boolean;
  sourceId?: string;
}

export interface Offer {
  offer_id: string;
  source_id: string;
  name: string;
  balance: number;
  rate: number;
  chain: "banano" | "nano";
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
  chain: "banano" | "nano";
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
  status:
    | "open"
    | "succeeded"
    | "failed"
    | "invalid hash"
    | "transaction error"
    | "transfer error"
    | "refund error"
    | "refunded";
  test: boolean;
  source: CustodialSource | ManualSource;
  transferGroup: string;
  version: string;
  offer: Offer;
  hash?: string;
  transferId?: string;
  transferAmount?: number;
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
    link_as_account?: string;
    linkAsAccount?: string;
    signature: string;
    work: string;
    subtype: string;
  };
  subtype: string;
  pending: number;
  source_account: number;
}

export interface Transaction {
  type: string;
  account: string;
  amount: number;
  local_timestamp: number;
  height: number;
  hash: string;
  confirmed: boolean;
}
