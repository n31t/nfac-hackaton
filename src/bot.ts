import { Telegraf, Markup } from "telegraf";
import { google, Auth } from "googleapis";
import path from "path";
import xlsx from "xlsx";
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
let spreadsheetId_2: string = "";
let currentUserIndex: number = 0;
let processedUsers: any[] = [];
let userDecision: string = "";
let userComment: string = "";
let rows: any[] = [];
let headers: any[] = [];
let sheetTitle: string = "";
let sheetTitle_2: string = "";
let currentUser: UserData | null = null;
let roundType: string = "";

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
  sheetTitle = sheet?.properties?.title || "Sheet1";
  const rowCount = sheet?.properties?.gridProperties?.rowCount || 1000;
  const columnCount = sheet?.properties?.gridProperties?.columnCount || 26;
  return { sheetTitle, rowCount, columnCount };
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
  if (["yes", "no", "idk"].includes(result.yesOrNo.toLowerCase())) {
    currentUser = user;
    const userJson = JSON.stringify(user, null, 2);
    await ctx.reply(`User to review:\n${userJson}`);

    await ctx.reply(
      "Please rate this user:",
      Markup.keyboard([["Hell NO", "NO", "IDK", "YES", "Hell YES"]])
        .oneTime()
        .resize()
    );
  } else {
    await proceedToNextUser(ctx);
  }
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
  const workbook = xlsx.readFile(url);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const extractedData = data.map((row: any) => row.slice(0, 3));
  console.log("Extracted data from Excel:", extractedData);

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
    if (neededSkills === "") {
      neededSkills = messageText;
      ctx.reply(
        `Got it! The needed skills are: ${neededSkills}. Now send me url of your Google Spreadsheet.`
      );
    } else if (
      spreadsheetId === "" &&
      messageText.startsWith("https://docs.google.com/spreadsheets/")
    ) {
      const urlParts = messageText.split("/");
      spreadsheetId = urlParts[5];
      ctx.reply(
        `Got the spreadsheet ID: ${spreadsheetId}. Processing the data...`
      );

      try {
        const { sheetTitle, rowCount, columnCount } = await getSpreadsheetInfo(
          spreadsheetId
        );
        const range = `${sheetTitle}!A1:S100`;

        console.log(`Fetching data from range: ${range}`);
        const data: any = await fetchSpreadsheetData(spreadsheetId, range);

        if (!data || data.length < 2) {
          ctx.reply("The provided spreadsheet does not contain enough data.");
          return;
        }

        headers = data[0];
        rows = data.slice(1);

        const arrayUsers: UserData[] = rows.map((row, index): UserData => {
          console.log(`Processing row ${index + 1}:`, row);
          return {
            fullName: row[0] || "",
            email: row[1] || "",
            birthDate: row[2] || "",
            phoneNumber: row[3] || "",
            programmingSkillLevel: row[4] || "",
            cv: row[5] || "",
            willingToParticipateOnPaidBasis: row[6]?.toLowerCase() === "да",
            telegramHandle: row[7] || "",
            linkedInLink: row[8] || "",
            socialMediaLinks: row[9] ? row[9].split(",") : [],
            gitHubHandle: row[10] || "",
            educationalPlacement: row[11] || "",
            specialtyAtUniversity: row[12] || "",
            jobPlacement: row[13] || "",
            programmingExperienceDescription: row[14] || "",
            pastProgrammingProjects: row[15] || "",
            bestAchievements: row[16] || "",
            availabilityInAlmaty: row[17]?.toLowerCase() === "истина",
            needAccommodationInAlmaty: row[18]?.toLowerCase() === "да",
          };
        });
        console.log("Headers:", headers);
        console.log("First row of data:", rows[0]);

        const startIndex = 10;
        const endIndex = 20;
        const limitedUsers = arrayUsers.slice(startIndex, endIndex);
        const vectorGPTService = new VectorGPTService();

        for (let i = 0; i < limitedUsers.length; i++) {
          const user = limitedUsers[i];
          const result = await vectorGPTService.createTotalMarks(
            user,
            neededSkills
          );

          processedUsers.push({ user, result });
          rows[startIndex + i][20] = result.points;
          rows[startIndex + i][21] = result.yesOrNo;
          rows[startIndex + i][22] = result.opinionAboutParticipant;
        }

        if (processedUsers.length > 0) {
          const { user, result } = processedUsers[currentUserIndex];
          await sendUserForReview(ctx, user, result);
        } else {
          ctx.reply("No users to review.");
        }

        headers[20] = "Review by AI";

        const updateValues = [headers, ...rows];
        console.log(
          "Preparing to update spreadsheet with values:",
          updateValues
        );

        await updateSpreadsheetData(
          spreadsheetId,
          `${sheetTitle}!A1:W${rows.length + 1}`,
          updateValues
        );

        ctx.reply(
          "The data of the first 10 users has been processed and evaluated. The spreadsheet has been updated."
        );
      } catch (error: any) {
        console.error("Error processing the spreadsheet:", error);
        ctx.reply(
          `Failed to fetch, parse, or update the spreadsheet. Error: ${error.message}`
        );
      }
    } else if (
      ["Hell NO", "NO", "IDK", "YES", "Hell YES"].includes(messageText)
    ) {
      userDecision = messageText;
      ctx.reply("Please add your comment to your decision.");
    } else if (userDecision !== "") {
      userComment = messageText;
      const userIndex = currentUserIndex + 10;
      const user = rows[userIndex];

      console.log(`Processing user at index: ${userIndex}`);
      console.log(`User data: ${JSON.stringify(user)}`);

      if (!user) {
        console.error(`User not found at index: ${userIndex}`);
        ctx.reply("An error occurred. Please try again.");
        return;
      }

      rows[userIndex][23] = userDecision;
      rows[userIndex][24] = userComment;

      console.log(
        `User decision: ${userDecision}, Comment: ${userComment}, User: ${JSON.stringify(
          rows[userIndex]
        )}`
      );

      userDecision = "";
      userComment = "";

      if (currentUser) {
        const vectorGPTService = new VectorGPTService();
        await vectorGPTService.saveToVectorDB(currentUser, userComment);
      }

      await proceedToNextUser(ctx);

      headers[23] = "User Decision";
      headers[24] = "User Comment";

      const updateValues = [headers, ...rows];
      await updateSpreadsheetData(
        spreadsheetId,
        `${sheetTitle}!A1:Y${rows.length + 1}`,
        updateValues
      );
    } else {
      ctx.reply(
        "Please provide the Google Spreadsheet URL or respond to the current user review."
      );
    }
  } else if (messageText === "Select for 2 round") {
    roundType = messageText;
    ctx.reply("Please send me the URL of the Google Spreadsheet.");
  } else if (roundType === "Select for 2 round") {
    if (
      spreadsheetId === "" &&
      messageText.startsWith("https://docs.google.com/spreadsheets/")
    ) {
      const urlParts = messageText.split("/");
      spreadsheetId = urlParts[5];
      ctx.reply(
        `Got the spreadsheet ID: ${spreadsheetId}. Processing the data...`
      );

      try {
        const { sheetTitle, rowCount, columnCount } = await getSpreadsheetInfo(
          spreadsheetId
        );
        const range = `${sheetTitle}!A1:C${rowCount}`;

        console.log(`Fetching data from range: ${range}`);
        const data = await fetchSpreadsheetData(spreadsheetId, range);

        if (!data || data.length < 2) {
          ctx.reply("The provided spreadsheet does not contain enough data.");
          return;
        }

        headers = data[0];
        rows = data.slice(1);

        const tasks: SecondTask[] = rows.map(
          (row): SecondTask => ({
            email: row[0],
            github: row[1],
            repo: row[2],
          })
        );

        for (const task of tasks) {
          const { email, github, repo } = task;
          const allCodeChunks = await getAllCode(github, repo);

          console.log(
            `Processed code for repository ${repo}, ${github}, ${email}:`,
            allCodeChunks.length,
            "chunks retrieved."
          );

          const chunkRange = ` ${sheetTitle}!E2:W${rows.length + 1}`;
          const chunkValues = allCodeChunks.map((chunk, index) => [chunk]);
          await updateSpreadsheetData(spreadsheetId, chunkRange, chunkValues);
        }

        ctx.reply(
          "Repositories have been processed and the code has been stored in the spreadsheet."
        );
      } catch (error: any) {
        console.error("Error processing the spreadsheet:", error);
        ctx.reply(
          `Failed to fetch, parse, or update the spreadsheet. Error: ${error.message}`
        );
      }
    } else {
      ctx.reply("Please send a valid URL for the Google Spreadsheet.");
    }
  }
});

export default bot;
