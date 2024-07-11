import "dotenv/config";
import express from "express";
import globalRouter from "./global-router";
import { logger } from "./logger";
import cors from "cors";
import bot from "./bot";

const app = express();
const PORT = process.env.PORT || 3838;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: "*",
    exposedHeaders: "*",
    credentials: true,
  })
);

app.use(logger);
app.use(express.json());
app.use("/api/v1/", globalRouter);

bot.launch();

app.listen(PORT, () => {
  console.log(`Server runs at http://localhost:${PORT}`);
});
