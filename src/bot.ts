import { Telegraf } from "telegraf";
import { google, sheets_v4, Auth } from "googleapis";
import path from "path";
import VectorGPTService from "./vector-gpt/vector-gpt.service";
import { UserData } from "./vector-gpt/types/userData";

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const bot = new Telegraf(botToken);

let neededSkills: string = "";
let spreadsheetId: string = "";

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
  const sheetTitle = sheet?.properties?.title || "Sheet1";
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

async function updateSpreadsheetData(
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  const authClient = await getAuthenticatedClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

bot.start((ctx) => {
  ctx.reply("Welcome! Send me the skills you need.");
});

bot.on("text", async (ctx) => {
  const messageText = ctx.message.text.trim();

  if (neededSkills === "") {
    neededSkills = messageText;
    ctx.reply(
      `Got it! The needed skills are: ${neededSkills}. Now send me the ID of the Google Spreadsheet.`
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
      // const range = `${sheetTitle}!A1:${String.fromCharCode(
      //
      //   65 + columnCount - 1
      // )}${rowCount}`;
      const range = `${sheetTitle}!A1:S100`;

      console.log(`Fetching data from range: ${range}`);
      const data: any = await fetchSpreadsheetData(spreadsheetId, range);

      if (!data || data.length < 2) {
        ctx.reply("The provided spreadsheet does not contain enough data.");
        return;
      }

      const headers = data[0]; //1
      const rows = data.slice(1); //2

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
      console.log("Mapped users:", arrayUsers);
      console.log("Headers:", headers);
      console.log("First row of data:", rows[0]);

      const limitedUsers = arrayUsers.slice(0, 20);
      const vectorGPTService = new VectorGPTService();

      for (let i = 0; i < limitedUsers.length; i++) {
        const user = limitedUsers[i];
        console.log(user);
        const result = await vectorGPTService.createTotalMarks(
          user,
          neededSkills
        );
        console.log(
          result.points,
          result.yesOrNo,
          result.opinionAboutParticipant
        );
        rows[i][20] = result.points;
        rows[i][21] = result.yesOrNo;
        rows[i][22] = result.opinionAboutParticipant;
      }

      headers[20] = "Review by AI";

      await updateSpreadsheetData(
        spreadsheetId,
        `${sheetTitle}!A1:W${rows.length + 1}`,
        [headers, ...rows]
      );

      ctx.reply(
        "The data of the first 5 users has been processed and evaluated. The spreadsheet has been updated."
      );
    } catch (error: any) {
      console.error("Error processing the spreadsheet:", error);
      ctx.reply(
        `Failed to fetch, parse, or update the spreadsheet. Error: ${error.message}`
      );
    }
  } else {
    ctx.reply("Please provide the Google Spreadsheet URL.");
  }
});

export default bot;
