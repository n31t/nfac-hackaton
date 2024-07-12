import { Telegraf, Markup } from "telegraf";
import { google, Auth } from "googleapis";
import path from "path";
import xlsx from "xlsx"; // Library for handling Excel files
import VectorGPTService from "./vector-gpt/vector-gpt.service";
import { UserData, SecondTask } from "./vector-gpt/types/userData";
import {
  getAllCode,
  findCommonLinesBetweenChunks,
} from "./githubCheat/githubCheat.service";
import { error } from "console";

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const bot = new Telegraf(botToken);

let neededSkills: string = "";
let spreadsheetId: string = "";
let currentUserIndex: number = 0;
let processedUsers: any[] = [];
let userDecision: string = "";
let userComment: string = "";
let rows: any[] = []; // Move rows to a higher scope
let headers: any[] = []; // Move headers to a higher scope
let sheetTitle: string = ""; // Move sheetTitle to a higher scope
let currentUser: UserData | null = null; // To store the current user being reviewed
let roundType: string = ""; // To store the type of round selected

async function getAuthenticatedClient() {
  const credentialsPath = path.join(__dirname, "../credentials.json");
  const auth = new Auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  return authClient as Auth.OAuth2Client;
}

async function getSpreadsheetInfo(spreadsheetId: string) {
  const authClient = await getAuthenticatedClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = response.data.sheets?.[0];
  sheetTitle = sheet?.properties?.title || "Sheet1"; // Assign to higher scope variable
  return (
    sheet?.properties?.gridProperties || { rowCount: 1000, columnCount: 26 }
  );
}

async function fetchSpreadsheetData(spreadsheetId: string, range: string) {
  const authClient = await getAuthenticatedClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values;
}

async function sendUserForReview(ctx: any, user: UserData, result: any) {
  currentUser = user;
  const userJson = JSON.stringify(user, null, 2);
  await ctx.reply(`User to review:\n${userJson}`);

  await ctx.reply(
    "Please rate this user:",
    Markup.keyboard([["Hell NO", "NO", "IDK", "YES", "Hell YES"]])
      .oneTime()
      .resize()
  );
}

async function proceedToNextUser(ctx: any) {
  currentUserIndex++;
  if (currentUserIndex < processedUsers.length) {
    const { user, result } = processedUsers[currentUserIndex];
    await sendUserForReview(ctx, user, result);
  } else {
    ctx.reply("All users have been reviewed. Thank you!");
  }
}

async function updateSpreadsheetData(
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  const authClient = await getAuthenticatedClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });

  console.log(`Updating spreadsheet data at range: ${range}`);
  console.log("Values to update:", JSON.stringify(values, null, 2));

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function processExcelData(url: string) {
  // Add logic to download and process the Excel file
  // For demonstration, let's assume the file is already available locally
  const workbook = xlsx.readFile(url);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // Extract data from each row within the first 3 columns
  const extractedData = data.map((row: any) => row.slice(0, 3));
  console.log("Extracted data from Excel:", extractedData);

  // You can now process the extracted data as needed
  return extractedData;
}

bot.start((ctx) => {
  ctx.reply(
    "Welcome! Please select an option:",
    Markup.keyboard([["Select for 1 round", "Select for 2 round"]])
      .oneTime()
      .resize()
  );
});

bot.on("text", async (ctx) => {
  const messageText = ctx.message.text.trim();

  if (
    messageText === "Select for 1 round" ||
    messageText === "Select for 2 round"
  ) {
    roundType = messageText;
    if (roundType === "Select for 1 round") {
      ctx.reply("Please send me the skills you need.");
    } else if (roundType === "Select for 2 round") {
      ctx.reply("Please send me the URL of the Excel file.");
    }
  } else if (roundType === "Select for 1 round") {
    neededSkills = messageText;
    ctx.reply(
      `Got it! The needed skills are: ${neededSkills}. Now send me the URL of your Google Spreadsheet.`
    );
  } else if (messageText.startsWith("https://docs.google.com/spreadsheets/")) {
    const urlParts = messageText.split("/");
    spreadsheetId = urlParts[5];
    ctx.reply(
      `Got the spreadsheet ID: ${spreadsheetId}. Processing the data...`
    );

    try {
      const gridProperties = await getSpreadsheetInfo(spreadsheetId);
      const range = `${sheetTitle}!A1:Z${gridProperties.rowCount}`;

      console.log(`Fetching data from range: ${range}`);
      const data = await fetchSpreadsheetData(spreadsheetId, range);

      if (!data || data.length < 2) {
        ctx.reply("The provided spreadsheet does not contain enough data.");
        return;
      }

      headers = data[0];
      rows = data.slice(1);

      const tasks: any = rows.map((row, index) => ({
        email: row[0] || "",
        github: row[1] || "",
        repo: row[2] || "",
        codeChunks: [],
      }));

      for (let i = 0; i < tasks.length; i++) {
        const task: any = tasks[i];
        task.codeChunks = await getAllCode(task.github, task.repo);

        if (i > 0) {
          const commonLines = await findCommonLinesBetweenChunks(
            tasks[i - 1].codeChunks,
            task.codeChunks
          );

          const commonLinesRange = `${sheetTitle}!F${i + 2}:F${i + 2}`;
          await updateSpreadsheetData(spreadsheetId, commonLinesRange, [
            [commonLines.join("\n")],
          ]);

          console.log(
            `Common lines between tasks ${i} and ${i + 1}:`,
            commonLines
          );
        }

        const chunkRange = `${sheetTitle}!E${i + 2}:E${i + 2}`;
        await updateSpreadsheetData(spreadsheetId, chunkRange, [
          [task.codeChunks.join("\n")],
        ]);
      }

      ctx.reply(
        "The data has been processed and the spreadsheet has been updated."
      );
    } catch (error: any) {
      console.error("Error processing the spreadsheet:", error);
      ctx.reply(`Failed to process the spreadsheet. Error: ${error.message}`);
    }
  } else {
    ctx.reply(
      "Please provide a valid URL for the Google Spreadsheet or select a round type."
    );
  }
});

export default bot;
