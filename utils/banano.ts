//@ts-ignore
import banano from "@bananocoin/bananojs";
import axios from "axios";
import { randomBytes } from "crypto";
import { Block, Order, Transaction } from "../types";

const setBanano = () => {
  banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
};
const setNano = () => {
  banano.setBananodeApiUrl("https://mynano.ninja/api/node");
};

function nano(callback: Function) {
  banano.setBananodeApiUrl("https://mynano.ninja/api/node");
  const response = callback();
  banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
  return response;
}
setNano();
export async function getRateEUR(): Promise<number> {
  const banano = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur"
  );
  const exchangeRate = banano.data.banano.eur;

  return exchangeRate;
}
export async function getRateUSD(): Promise<number> {
  const banano = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=usd"
  );
  const exchangeRate = banano.data.banano.usd;

  return exchangeRate;
}

export async function getExchangeRate() {
  const eur = await getRateEUR();
  const usd = await getRateUSD();
  return usd / eur;
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
export async function sendNano(amount: number, recipient: string, seed: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const rawAmount = banano.getRawStrFromNanoStr(String(amount));
    // const balance = await getBalance(process.env.ADDRESS!);
    // balance - amount < 3000 &&
    //   sendMail("balance is low: current balance is " + (balance - amount) + " BAN");
    banano.sendAmountToNanoAccount(
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
    try {
      const response = await axios.get<Block>(
        "https://api.yellowspyglass.com/yellowspyglass/block/" + hash
      );

      const correct_recipient = response.data.contents.linkAsAccount === recipient;
      const correct_amount =
        Number(banano.getBananoPartsFromRaw(response.data.amount).banano) === Math.floor(amount) &&
        Number(banano.getBananoPartsFromRaw(response.data.amount).banoshi) ===
          Math.floor((amount - Math.floor(amount)) * 100);
      return correct_recipient && correct_amount;
    } catch (error) {
      console.log(error);
      console.error("Error: Can't get block with hash " + hash);
      return false;
    }
  }
}

export async function getBalance(account: string) {
  const accountInfo = await banano.getAccountInfo(account);
  return Math.floor(accountInfo.balance_decimal);
}

export async function receivePending(seed: string, chain: string) {
  chain === "banano"
    ? await banano.receiveBananoDepositsForSeed(seed, 0, process.env.BANANO_REPRESENTATIVE!)
    : await banano.receiveNanoDepositsForSeed(seed, 0, process.env.NANO_REPRESENTATIVE!);
}

export async function getBalances(accounts: string[] = [process.env.ADDRESS!], chain: string) {
  await banano.getAccountsPending(accounts, accounts.length - 1);
  chain === "banano"
    ? await banano.receiveBananoDepositsForSeed(
        process.env.BANANO_SEED,
        0,
        process.env.BANANO_REPRESENTATIVE
      )
    : await banano.receiveNanoDepositsForSeed(
        process.env.NANO_SEED,
        0,
        process.env.NANO_REPRESENTATIVE
      );

  const balances = accounts.map(async (acc) => {
    const accountInfo = await banano.getAccountInfo(acc);
    const balance = Math.floor(accountInfo.balance_decimal);
    return balance;
  });
  return await Promise.all(balances);
}

export async function generateNewAccount(
  chain: "banano" | "nano"
): Promise<{ seed: string; address: string }> {
  const seed = randomBytes(32).toString("hex");
  const address =
    chain === "banano"
      ? await banano.getBananoAccountFromSeed(seed, 0)
      : await banano.getNanoAccountFromSeed(seed, 0);
  console.log(address);
  const hash =
    chain === "banano"
      ? await sendBanano(0.0001, address, process.env.BANANO_SEED!)
      : await nano(() => sendNano(0.0001, address, process.env.NANO_SEED!));
  console.log(hash);

  chain === "banano"
    ? banano.openBananoAccountFromSeed(
        seed,
        0,
        process.env.BANANO_REPRESENTATIVE,
        hash,
        banano.getRawStrFromBananoStr("0.0001")
      )
    : nano(
        banano.openNanoAccountFromSeed(
          seed,
          0,
          process.env.NANO_REPRESENTATIVE,
          hash,
          banano.getRawStrFromNanoStr("0.0001")
        )
      );
  return { seed, address };
}

interface History {
  account: string;
  history: Transaction[];
}

export async function confirmAccount(account: string, chain: string): Promise<boolean> {
  chain === "banano"
    ? await banano.receiveBananoDepositsForSeed(
        process.env.BANANO_SEED,
        0,
        process.env.BANANO_REPRESENTATIVE
      )
    : await banano.receiveNanoDepositsForSeed(
        process.env.NANO_SEED,
        0,
        process.env.NANO_REPRESENTATIVE
      );
  const history: History = await banano.getAccountHistory(account, -1);

  const confirmingTX = history.history.find((tx: Transaction) => {
    return (
      Number(banano.getBananoPartsFromRaw(tx.amount).banoshi) === 1 &&
      tx.local_timestamp - Date.now() < 1000 * 60 * 60 &&
      tx.account === process.env.ADDRESS
    );
  });
  if (confirmingTX) {
    chain === "banano"
      ? sendBanano(0.01, account, process.env.BANANO_SEED!)
      : sendNano(0.01, account, process.env.NANO_SEED!);
  }
  return !!confirmingTX;
}
