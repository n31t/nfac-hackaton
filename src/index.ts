import "dotenv/config";
import express from "express";
import globalRouter from "./global-router";
import { logger } from "./logger";
import cors from "cors";
import bot from "./bot";

import { getAllCode } from "./githubCheat/githubCheat.service";

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

const owner = 'n31t';
const repo = 'frontend2';

getAllCode(owner, repo)
    .then(code => {
        console.log('All code fetched. Total length:', code.length);
        // Uncomment the next line to see the actual code (be careful with large repos!)
        console.log(code);
    })
    .catch(error => console.error('Error:', error));
