import { createLogger, transports } from "winston";
import LokiTransport from "winston-loki";
const options = {
  transports: [
    new transports.Console(),
    new LokiTransport({
      host: "http://127.0.0.1:3100"
    })
  ]
  ...
};
export const logger = createLogger(options);