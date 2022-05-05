//@ts-ignore
import banano from "@bananocoin/bananojs";
import axios from "axios";
import { randomBytes } from "crypto";
import { Block, Order, Transaction } from "../types";

banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
export async function getRate(): Promise<number> {
  const banano = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur"
  );
  const exchangeRate = banano.data.banano.eur;

  return exchangeRate;
}

export async function sendBanano(amount: number, recipient: string, seed: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const rawAmount = banano.getRawStrFromBananoStr(String(amount));
    // const balance = await getBalance(process.env.ADDRESS!);
    // balance - amount < 3000 &&
    //   sendMail("balance is low: current balance is " + (balance - amount) + " BAN");
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

export async function verifyTransaction(
  hash: string,
  recipient: string,
  amount: number
): Promise<boolean> {
  try {
    const response = await axios.get<Block>("https://api.creeper.banano.cc/v2/blocks/" + hash);

    const correct_recipient = response.data.contents.link_as_account === recipient;
    const correct_amount =
      Number(banano.getBananoPartsFromRaw(response.data.amount).banano) === Math.floor(amount) &&
      Number(banano.getBananoPartsFromRaw(response.data.amount).banoshi) ===
        Math.floor((amount - Math.floor(amount)) * 100);

    return correct_recipient && correct_amount;
  } catch (error) {
    console.error("Error: Can't get block with hash " + hash);
    return false;
  }
}

export async function getBalance(account: string) {
  const accountInfo = await banano.getAccountInfo(account);
  return Math.floor(accountInfo.balance_decimal);
}

export async function receivePending(seed: string) {
  await banano.receiveBananoDepositsForSeed(seed, 0, process.env.REPRESENTATIVE);
}

export async function getBalances(accounts: string[] = [process.env.ADDRESS!]) {
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
  const seed = randomBytes(32).toString("hex");
  const address = await banano.getBananoAccountFromSeed(seed, 0);
  const hash = await sendBanano(0.0001, address, process.env.SEED!);
  banano.openBananoAccountFromSeed(
    seed,
    0,
    process.env.REPRESENTATIVE,
    hash,
    banano.getRawStrFromBananoStr("0.0001")
  );
  return { seed, address };
}

interface History {
  account: string;
  history: Transaction[];
}

export async function confirmAccount(account: string): Promise<boolean> {
  await banano.receiveBananoDepositsForSeed(process.env.SEED, 0, process.env.REPRESENTATIVE);
  const history: History = await banano.getAccountHistory(account, -1);

  const confirmingTX = history.history.find((tx: Transaction) => {
    return (
      Number(banano.getBananoPartsFromRaw(tx.amount).banoshi) === 1 &&
      tx.local_timestamp - Date.now() < 1000 * 60 * 60 &&
      tx.account === process.env.ADDRESS
    );
  });
  if (confirmingTX) {
    sendBanano(0.01, account, process.env.SEED!);
  }
  return !!confirmingTX;
}
