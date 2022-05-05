export function sendMail(message: string, recipient: string = "constantingoeldel@gmail.com") {
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
    true
      ? resolve("Not sending email as in DEV mode")
      : sgMail
          .send(msg)
          .then(() => {
            resolve("Email sent");
          })
          .catch((error: unknown) => {
            reject(error);
          });
  });
}
