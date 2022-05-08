import { sendBanano, sendNano, verifyTransaction } from "../../utils/banano";
import axios, { AxiosResponse } from "axios";
import { refund, transfer } from "../../utils/stripe";
import { sendMail } from "../../utils/mail";
import { Order } from "../../types";
import getDB, { Database } from "../../utils/db";
import {
  DatabaseError,
  VersionError,
  ServerError,
  TransactionError,
  TransferError,
  ValidationError,
  RefundError,
} from "../../utils/errors";

const VERSION = process.env.VERSION!;
export default async function paymentSucceeded(paymentIntent: string) {
  // success or data errors: Return nothing; server errors throw
  const db = await getDB();
  try {
    const order = await db.getOrder(paymentIntent);
    if (order.version !== VERSION)
      throw new VersionError("Order " + paymentIntent + " is not from the correct origin");
    if (order.status === "succeeded" || order.status === "refunded")
      throw new ValidationError("Order " + paymentIntent + " has already been processed");

    const hash = order.hash || (await pay(order));
    await verifyAndProcess(db, hash, order);
    console.log("Order " + paymentIntent + " has been processed", order.amount, order.currency);
    sendMail(
      "Order " +
        paymentIntent +
        " has been processed. " +
        order.amount +
        " " +
        order.chain +
        " have been transferred."
    );
    return "Success";
  } catch (error) {
    if (error instanceof ServerError) {
      console.log(
        "Unrecoverable error: " +
          paymentIntent +
          "\n Message: " +
          error.message +
          "\n Stack: " +
          error.stack
      );
      db.addError(paymentIntent, "Server error: " + String(error));
      throw error;
    } else if (error instanceof DatabaseError || error instanceof VersionError) {
      console.log(error.message);
      db.addError(paymentIntent, error.message);
      return error.message;
    } else if (error instanceof ValidationError) {
      console.log(error.message);
      db.addError(paymentIntent, error.message);
      db.updateStatus(paymentIntent, "invalid hash");
      return error.message;
    } else if (error instanceof TransactionError) {
      console.log(error.message);
      db.addError(paymentIntent, error.message);
      db.updateStatus(paymentIntent, "transaction error");
      return error.message;
    } else if (error instanceof TransferError) {
      console.log(error);
      db.addError(paymentIntent, error.message);
      db.updateStatus(paymentIntent, "transfer error");
      return "Order " + paymentIntent + " has a payout larger than the current balance";
    } else {
      console.log("Unrecoverable error: " + paymentIntent + "\n" + "Unknown error: " + error);
      db.addError(paymentIntent, "Unknown error: " + String(error));
      throw error;
    }
  }
  async function verifyAndProcess(db: Database, hash: string, order: Order) {
    const valid = await verifyTransaction(hash, order.address, order.amount, order.chain);
    if (valid) {
      try {
        // const price_after_fees = order.test ? 1 : order.price - 25 - order.price * 0.05;
        db.patchOrder(order.paymentIntent, { hash: hash });
        await db.updateStatus(order.paymentIntent, "succeeded");
        if (order.test) {
          // console.log("Not post-processing payment because test mode is on");
          sendMail(
            "Successfully handled a test payment. Test payments are currently free of charge for users so you won't receive any compensation for this transaction. If you want to disable test payments, contact me.",
            order.source.email
          );
        } else {
          sendMail(
            "Successfully handled payment. Check your dashboard for the transaction details.",
            order.source.email
          );
          //   "Transaction is valid and confirmed! Charging " +
          //     (order.price - price_after_fees) +
          //     " ct. for this order. " +
          //     price_after_fees +
          //     " will be payed out to source " +
          //     order.source.id
          // );
          // await postPayment(db, order, price_after_fees, order.paymentIntent);
        }
      } catch (error) {
        if (error instanceof TransferError) {
          throw error;
        } else {
          throw new ServerError("An error occured while processing the payment: " + error);
        }
      }
    } else {
      await db.updateStatus(order.paymentIntent, "invalid hash");
      console.log("Invalid hash: Refunding payment");
      try {
        await refund(order.paymentIntent, order.source.account);
        await db.updateStatus(order.paymentIntent, "refunded");
      } catch (error) {
        if (error instanceof RefundError) {
          console.log("Refund error: " + error.message);
          await db.updateStatus(order.paymentIntent, "refund error");
          throw error;
        }
      }
      throw new ValidationError("Order " + order.paymentIntent + " has an invalid hash");
    }
  }

  async function pay(order: Order) {
    let hash: string;
    try {
      if (order.source.custodial) {
        hash =
          order.source.chain === "banano"
            ? await sendBanano(order.amount, order.address, order.source.seed)
            : await sendNano(order.amount, order.address, order.source.seed);
        hash &&
          console.log(
            "Successfully payed! Now sending " +
              order.amount +
              " bananos to " +
              order.address +
              " with hash " +
              hash
          );
      } else {
        const response: AxiosResponse<{ hash: string }> = await axios.post(
          order.source.webhook,
          {
            amount: order.amount,
            address: order.address,
            test: order.test,
          },
          { headers: { Authorization: order.source.secret } }
        );
        hash = response.data.hash;
      }
      return hash;
    } catch (error) {
      if (error instanceof Error) {
        throw new TransactionError("Error while sending BAN: " + error.message);
      } else {
        throw new TransactionError("Error while sending BAN: Unknown");
      }
    }
  }
  //   async function postPayment(
  //     db: Database,
  //     order: Order,
  //     price_after_fees: number,
  //     paymentIntent: string
  //   ) {
  //     const result = order.transferId
  //       ? { id: order.transferId, amount: order.transferAmount }
  //       : await transfer(
  //           Math.floor(price_after_fees),
  //           order.source.account,
  //           order.transferGroup,
  //           process.env.DEV_MODE == "true"
  //         );
  //     await db.patchOrder(paymentIntent, { transferId: result.id, transferAmount: price_after_fees });
  //     await db.updateStatus(paymentIntent, "succeeded");
  //     await sendMail(
  //       "Merchant Update: \n The order has been fulfilled. You will receive " +
  //         price_after_fees / 100 +
  //         "€ for the " +
  //         order.amount +
  //         " BAN you provided. See all the details in your dashboard at ban.app/dashboard",
  //       order.source.email
  //     );
  //     console.log("Order fulfilled");
  //   }
}
