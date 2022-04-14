import { sendMail } from "./_utils";

test("Can send mail", () => {
  expect(sendMail("Test test test")).toBe(true);
});
