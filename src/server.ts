import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import logger from "./config/logger.ts";

const app = express();

const port: number = 3000;
const host: string | number = "localhost";

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res, next) => {
  res.send("Hello world");
  next();
});

app.listen(port, () => {
  logger.info(`Server started on http://${host}:${port}`);
});
