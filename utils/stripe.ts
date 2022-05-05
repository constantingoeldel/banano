import stripeJs from "stripe";
import { RefundError, TransferError } from "./errors";
export async function transfer(
  amount: number,
  destination: string,
  transfer_group: string,
  dev: boolean
) {
  try {
    const stripeSecret = dev ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!;
    const stripe = new stripeJs(stripeSecret, { apiVersion: "2020-08-27" });
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: "eur",
      destination,
      transfer_group,
    });
    console.log(transfer);
    return transfer;
  } catch (error) {
    throw new TransferError(String(error));
  }
}

export async function refund(charge: string, account: string) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET!;

    const stripe = new stripeJs(stripeSecret, { apiVersion: "2020-08-27" });
    const refund = await stripe.refunds.create(
      {
        charge,
        refund_application_fee: true,
      },
      {
        stripeAccount: account,
      }
    );
  } catch (error) {
    throw new RefundError(String(error));
  }
}
