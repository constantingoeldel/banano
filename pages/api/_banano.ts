import banano from "@bananocoin/bananojs";
import { sendMail } from "./_utils";

export async function sendBanano(amount: number, recipient: string): Promise<String> {
  return new Promise(async (resolve, reject) => {
    banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
    const rawAmount = banano.getRawStrFromBananoStr(String(amount));
    const balance = await getBalance();
    balance - amount < 3000 &&
      sendMail("balance is low: current balance is " + (balance - amount) + " BAN");
    banano.sendAmountToBananoAccount(
      process.env.SEED,
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

export async function getBalance() {
  banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
  const privateKey = banano.getPrivateKey(process.env.SEED, 0);
  const publicKey = await banano.getPublicKey(privateKey);
  const account = banano.getBananoAccount(publicKey);

  await banano.getAccountsPending([account], 10);
  await banano.receiveBananoDepositsForSeed(process.env.SEED, 0, process.env.REPRESENTATIVE);
  const accountInfo = await banano.getAccountInfo(account);
  const balance = Math.floor(accountInfo.balance_decimal);
  return balance;
}
