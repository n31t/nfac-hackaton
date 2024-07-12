import "dotenv/config";
import express from "express";
import globalRouter from "./global-router";
import { logger } from "./logger";
import cors from "cors";
import bot from "./bot";
import {
  findCommonLinesBetweenChunks,
  getAllCode,
} from "./githubCheat/githubCheat.service";

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

const owner1 = "n31t";
const repo1 = "backend";

const owner2 = "n31t";
const repo2 = "nf-hw-backend-4";

// Promise.all([getAllCode(owner1, repo1), getAllCode(owner2, repo2)])
//     .then(([chunks1, chunks2]) => {
//         console.log(`Total chunks in repo1: ${chunks1.length}`);
//         chunks1.forEach((chunk, index) => {
//             console.log(`Chunk ${index + 1} length in repo1: ${chunk.length}`);
//         });

//         console.log(`Total chunks in repo2: ${chunks2.length}`);
//         chunks2.forEach((chunk, index) => {
//             console.log(`Chunk ${index + 1} length in repo2: ${chunk.length}`);
//         });

//         return findCommonLinesBetweenChunks(chunks1, chunks2);
//     })
//     .then(commonLines => {
//         console.log(`Common lines: ${commonLines.join(', ')}`);
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
