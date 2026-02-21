import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import logger from "./config/logger.ts";
import cors from "cors";
import env from "./config/env.ts";

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res, next) => {
  res.send("Hello world");
  next();
});

app.listen(env.PORT, () => {
  logger.info(`Server started on http://localhost:${env.PORT}`);
});
