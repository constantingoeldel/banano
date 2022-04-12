export interface Order {
  timestamp: number;
  address: string;
  paymentIntent: string;
  amount: number;
  price: number;
  status: "open" | "successful" | "failed";
  test: boolean;
}
