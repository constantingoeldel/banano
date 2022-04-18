//@ts-ignore
import banano from "@bananocoin/bananojs";
import axios from "axios";
import { randomBytes } from "crypto";
import { Block, Order } from "../types";
import { sendMail } from "./mail";

export async function getRate(): Promise<number> {
  const banano = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur"
  );
  const exchangeRate = banano.data.banano.eur;

  return exchangeRate;
}

export async function sendBanano(amount: number, recipient: string, seed: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
    const rawAmount = banano.getRawStrFromBananoStr(String(amount));
    const balance = await getBalance(process.env.ADDRESS!);
    balance - amount < 3000 &&
      sendMail("balance is low: current balance is " + (balance - amount) + " BAN");
    banano.sendAmountToBananoAccount(
      seed,
      0,
      recipient,
      rawAmount,
      (hash: string) => {
        console.log("Transaction hash:", hash), resolve(hash);
      },
      (error: any) => reject(error)
    );
  });
}

export async function verifyTransaction(hash: string, order: Order) {
  banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
  const block: Block = await axios.get("https://api.creeper.banano.cc/v2/blocks/" + hash);
  const correct_recipient = block.contents.link_as_account === order.address;
  const correct_amount = banano.getBananoPartsFromRaw(block.amount).banano === order.amount;
  return correct_recipient && correct_amount;
}

export async function getBalance(account: string) {
  banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
  const accountInfo = await banano.getAccountInfo(account);
  return Math.floor(accountInfo.balance_decimal);
}

export async function getBalances(accounts: string[] = [process.env.ADDRESS!]) {
  banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");

  await banano.getAccountsPending(accounts, accounts.length - 1);
  await banano.receiveBananoDepositsForSeed(process.env.SEED, 0, process.env.REPRESENTATIVE);

  const balances = accounts.map(async (acc) => {
    const accountInfo = await banano.getAccountInfo(acc);
    const balance = Math.floor(accountInfo.balance_decimal);
    return balance;
  });
  return await Promise.all(balances);
}

export async function generateNewAccount(): Promise<{ seed: string; address: string }> {
  banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
  const seed = randomBytes(32).toString("hex");
  const address = await banano.getBananoAccountFromSeed(seed, 0);
  const hash = await sendBanano(0.0001, address, process.env.SEED!);
  const openHash = banano.openBananoAccountFromSeed(
    seed,
    0,
    process.env.REPRESENTATIVE,
    hash,
    banano.getRawStrFromBananoStr("0.0001")
  );
  return { seed, address };
}
