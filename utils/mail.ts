import { CustodialSource, ManualSource } from "../types";

export function sendMail(
  message: string,
  recipient: string = "constantingoeldel@gmail.com",
  copy = false
) {
  return new Promise((resolve, reject) => {
    const sgMail = require("@sendgrid/mail");
    const DEV = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: recipient, // Change to your recipient
      from: "server@banano.acctive.digital", // Change to your verified sender
      subject: "Message from the banano server",
      text: message,
    };
    if (DEV) {
      console.log("Not sending mail in development");
      resolve("Not sending email as in DEV mode");
    } else {
      sgMail
        .send(msg)
        .then(() => {
          resolve("Email sent");
        })
        .catch((error: unknown) => {
          reject(error);
        });
      copy &&
        sgMail
          .send(msg)
          .then(() => {
            resolve("Email copy sent");
          })
          .catch((error: unknown) => {
            reject(error);
          });
      console.log("Email sent");
    }
  });
}

export const manualUnboarding = (source: ManualSource) => `Hey, ${source.name}!
I'm very happy that you want to sell your ${source.chain.toUpperCase()} on the Marketplace, here are your credentials:

Name: ${source.name}
Webhook URL: ${source.webhook} (I will make all offer and payment requests to this URL)
Webhook Secret: ${source.secret} (I will authenticate my requests with this secret)

Now it's up to you to set up your server: 
There will be two types of requests: Offer requests and Payment requests. Offer requests are made to get the amount of ${source.chain.toUpperCase()} you want to sell and the price at which you want to sell them. I will send a GET-Request to your webhook endpoint and you respond with a JSON object containing balance and rate.
Payment requests are made to send the ${source.chain.toUpperCase()} to the buyer: I will send a POST-Request to your webhook endpoint and you respond with the transaction hash.

An example server setup can be found here: https://pastebin.com/dMLfJ39P

If you have any questions or issues, let me know via constantingoeldel@gmail.com

I'm very excited to have you,

Constantin
`;
export const custodialUnboarding = (source: CustodialSource) => `Hey, ${source.name}!
I'm very happy that you want to sell your ${source.chain.toUpperCase()} on the Marketplace, here are your credentials:

Name: ${source.name} 
Address: ${source.address} (whatever funds you send there will be offered to others)
Seed: ${source.seed} (keep this one safe, you can withdraw all your funds with it)

You sell your ${source.chain.toUpperCase()} at a minimum of ${
  source.price.min
} cents, after which you ${source.price.market ? "" : "don't"} follow the market price ${
  source.price.margin === 1
    ? "exactly"
    : "with a margin of " + (source.price.margin * 100 - 100).toFixed(1) + "%"
}. Let me know if you want to change those (a dashboard will come soon)

To get started, simply send some ${source.chain.toUpperCase()} to your new address. Very excited to have you,

Constantin
`;
