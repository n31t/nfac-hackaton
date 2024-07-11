import { Telegraf } from "telegraf";
import axios from "axios";
import * as XLSX from "xlsx";
import VectorGPTService from "./vector-gpt/vector-gpt.service";
import { UserData } from "./vector-gpt/types/userData";

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const bot = new Telegraf(botToken);

let neededSkills: string = "";
let arrayUsers: UserData[] = [];

const fetchExcelFile = async (url: string) => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const workbook = XLSX.read(response.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return { workbook, jsonData, sheetName };
  } catch (error: any) {
    console.error("Error fetching the Excel file:", error.message);
    throw new Error("Failed to fetch the Excel file");
  }
};

bot.start((ctx) => {
  ctx.reply("Welcome! Send me the skills you need.");
});

bot.on("text", async (ctx) => {
  if (neededSkills === "") {
    neededSkills = ctx.message.text;
    ctx.reply(
      `Got it! The needed skills are: ${neededSkills}. Now send me a URL to an online Excel file, and I will return the first 5 rows (excluding the header row).`
    );
  } else {
    const url = ctx.message.text;
    try {
      const { workbook, jsonData, sheetName } = await fetchExcelFile(url);

      if (jsonData.length < 2) {
        ctx.reply("The provided Excel file does not contain enough data.");
        return;
      }

      const headers: any = jsonData[0];
      const rows = jsonData.slice(1);

      arrayUsers = rows.map((row: any): UserData => {
        return {
          fullName: row[0] || "",
          email: row[1] || "",
          birthDate: row[2] || "",
          phoneNumber: row[3] || "",
          programmingSkillLevel: row[4] || "",
          cv: row[5] || "",
          willingToParticipateOnPaidBasis: row[6] === "да",
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
          availabilityInAlmaty: row[17] === "ИСТИНА",
          needAccommodationInAlmaty: row[18] === "да",
        };
      });

      const limitedUsers = arrayUsers.slice(0, 5);
      const vectorGPTService = new VectorGPTService();

      // Ensure the new column header is added
      headers.push("reviewed by AI");

      for (let i = 0; i < limitedUsers.length; i++) {
        const user = limitedUsers[i];
        const result = await vectorGPTService.createTotalMarks(
          user,
          neededSkills
        );
        console.log(
          neededSkills,
          result,
          `Result for ${user.fullName}:`,
          result.yesOrNo,
          result.points,
          result.opinionAboutParticipant
        );
        // Add the "reviewed by AI" column value to the row
        jsonData[i + 1].push(result.points);
      }

      const newSheet = XLSX.utils.json_to_sheet(jsonData, { header: headers });
      workbook.Sheets[sheetName] = newSheet;
      const filePath = "./updated_file.xlsx";
      XLSX.writeFile(workbook, filePath);

      ctx.reply(
        "The data of the first 5 users has been processed and evaluated. Here is the updated file."
      );

      await ctx.replyWithDocument({ source: filePath });
    } catch (error: any) {
      console.error("Error processing the Excel file:", error.message);
      ctx.reply(
        "Failed to fetch or parse the Excel file. Please make sure the URL is correct and the file is accessible."
      );
    }
  }
});

export default bot;
