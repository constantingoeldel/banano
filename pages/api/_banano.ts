import banano from "@bananocoin/bananojs";

export async function sendBanano(amount: number, recipient: string) {
  const rawAmount = banano.getRawStrFromBananoStr(String(amount));
  banano.sendAmountToBananoAccount(
    process.env.SEED,
    0,
    recipient,
    rawAmount,
    (hash: string) => console.log("Transaction hash:", hash),
    (error: any) => console.log(error)
  );
}

export async function getBalance() {
  banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
  const privateKey = banano.getPrivateKey(process.env.SEED, 0);
  const publicKey = await banano.getPublicKey(privateKey);
  const account = banano.getBananoAccount(publicKey);

  await banano.getAccountsPending([account], 10);
  await banano.receiveBananoDepositsForSeed(
    process.env.SEED,
    0,
    process.env.REPRESENTATIVE
  );
  const accountInfo = await banano.getAccountInfo(account);
  const balance = Math.floor(accountInfo.balance_decimal);
  return balance;
}
