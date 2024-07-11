import { Telegraf } from "telegraf";
import axios from "axios";
import * as XLSX from "xlsx";

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const bot = new Telegraf(botToken);

const fetchExcelFile = async (url: string) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const workbook = XLSX.read(response.data, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return jsonData;
};

bot.start((ctx) => {
  ctx.reply(
    "Welcome! Send me a URL to an online Excel file, and I will return the first 5 rows (excluding the header row)."
  );
});

bot.on("text", async (ctx) => {
  const url = ctx.message.text;
  try {
    const data = await fetchExcelFile(url);

    if (data.length < 2) {
      ctx.reply("The provided Excel file does not contain enough data.");
      return;
    }

    const headers: any = data[1];
    const rows = data.slice(2, 4);

    const formattedRows = rows
      .map((row: any) => {
        return headers
          .map((header, index) => `${header}: ${row[index] || ""}`)
          .join("\n");
      })
      .join("\n\n");

    ctx.reply(`Here are the first 5 rows:\n\n${formattedRows}`);
  } catch (error) {
    ctx.reply(
      "Failed to fetch or parse the Excel file. Please make sure the URL is correct and the file is accessible."
    );
  }
});

export default bot;
