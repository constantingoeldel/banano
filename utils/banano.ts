//@ts-ignore
import banano from "@bananocoin/bananojs";
import axios from "axios";
import { randomBytes } from "crypto";
import { Block, Order, Transaction } from "../types";

const setBanano = () => {
  banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
};
export const setNano = () => {
  banano.setBananodeApiUrl("https://app.natrium.io/api");
};

// function nano(callback: Function) {
//   banano.setBananodeApiUrl("https://mynano.ninja/api/node");
//   const response = callback();
//   banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
//   return response;
// }
setBanano();
export async function getRateEUR(chain: "banano" | "nano" = "banano"): Promise<number> {
  const response =
    chain === "banano"
      ? await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=eur"
        )
      : await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=nano&vs_currencies=eur");
  const exchangeRate = response.data[chain].eur;

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
  setBanano();
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
  amount: number,
  chain: "banano" | "nano" = "banano"
): Promise<boolean> {
  try {
    const response =
      chain === "banano"
        ? await axios.get<Block>("https://api.creeper.banano.cc/v2/blocks/" + hash)
        : await axios.get<Block>("https://api.nanoblockexplorer.com/v2/blocks/" + hash);

    const correct_recipient = response.data.contents.link_as_account === recipient;
    const correct_amount =
      chain === "banano"
        ? Number(banano.getBananoPartsFromRaw(response.data.amount).banano) ===
            Math.floor(amount) &&
          Number(banano.getBananoPartsFromRaw(response.data.amount).banoshi) ===
            Math.floor((amount - Math.floor(amount)) * 100)
        : Number(banano.getNanoPartsFromRaw(response.data.amount).nano) === Math.floor(amount) &&
          Number(banano.getNanoPartsFromRaw(response.data.amount).nanoshi) ===
            amount * 1000000 - Math.floor(amount) * 1000000;

    return correct_recipient && correct_amount;
  } catch (err) {
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
      // console.error(err);
      console.error("Error: Can't get block with hash " + hash);
      return false;
    }
  }
}

async function getBananoBalance(account: string) {
  setBanano();
  const accountInfo = await banano.getAccountInfo(account);
  return Math.floor(accountInfo.balance_decimal);
}
async function getNanoBalance(account: string) {
  setNano();
  const accountInfo = await banano.getAccountInfo(account);
  console.log(accountInfo);

  return banano.getNanoPartsFromRaw(accountInfo.balance).nano;
}

export async function getBalance(
  account: string,
  chain: "banano" | "nano" = "banano"
): Promise<number> {
  return chain === "banano" ? await getBananoBalance(account) : await getNanoBalance(account);
}

export async function receivePending(seed: string, chain: string = "banano") {
  chain === "banano" ? setBanano() : setNano();
  chain === "banano"
    ? await banano.receiveBananoDepositsForSeed(seed, 0, process.env.BANANO_REPRESENTATIVE!)
    : await banano.receiveNanoDepositsForSeed(seed, 0, process.env.NANO_REPRESENTATIVE!);
}

export async function getBalances(accounts: string[] = [process.env.ADDRESS!], chain: string) {
  chain === "banano" ? setBanano() : setNano();
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
  chain === "banano" ? setBanano() : setNano();
  const seed = randomBytes(32).toString("hex");
  const address =
    chain === "banano"
      ? await banano.getBananoAccountFromSeed(seed, 0)
      : await banano.getNanoAccountFromSeed(seed, 0);
  console.log(address);
  const hash =
    chain === "banano"
      ? await sendBanano(0.0001, address, process.env.BANANO_SEED!)
      : await sendNano(0.0001, address, process.env.NANO_SEED!);
  console.log(hash);

  chain === "banano"
    ? banano.openBananoAccountFromSeed(
        seed,
        0,
        process.env.BANANO_REPRESENTATIVE,
        hash,
        banano.getRawStrFromBananoStr("0.0001")
      )
    : banano.openNanoAccountFromSeed(
        seed,
        0,
        process.env.NANO_REPRESENTATIVE,
        hash,
        banano.getRawStrFromNanoStr("0.0001")
      );

  return { seed, address };
}

interface History {
  account: string;
  history: Transaction[];
}

export async function confirmAccount(account: string, chain: string): Promise<boolean> {
  chain === "banano" ? setBanano() : setNano();
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
