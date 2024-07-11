import { Telegraf } from "telegraf";
import axios from "axios";
import * as XLSX from "xlsx";
import VectorGPTService from "./vector-gpt/vector-gpt.service";
import { userData } from "./vector-gpt/types/userData";

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const bot = new Telegraf(botToken);

let neededSkills: string = "";
let arrayUsers: userData[] = [];

const fetchExcelFile = async (url: string) => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const workbook = XLSX.read(response.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return jsonData;
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
      const data = await fetchExcelFile(url);

      if (data.length < 2) {
        ctx.reply("The provided Excel file does not contain enough data.");
        return;
      }

      const headers: any = data[1];
      const rows = data.slice(2);

      arrayUsers = rows.map((row: any): userData => {
        return {
          fullName: row[1] || "",
          email: row[2] || "",
          birthDate: row[3] || "",
          phoneNumber: row[4] || "",
          programmingSkillLevel: row[5] || "",
          cv: row[6] || "",
          willingToParticipateOnPaidBasis: row[7] === "да",
          telegramHandle: row[8] || "",
          linkedInLink: row[9] || "",
          socialMediaLinks: row[10] ? row[10].split(",") : [],
          gitHubHandle: row[11] || "",
          educationalPlacement: row[12] || "",
          specialtyAtUniversity: row[13] || "",
          jobPlacement: row[14] || "",
          programmingExperienceDescription: row[15] || "",
          pastProgrammingProjects: row[16] || "",
          bestAchievements: row[17] || "",
          availabilityInAlmaty: row[18] === "ИСТИНА",
          needAccommodationInAlmaty: row[19] === "да", // WE DON'T CARE
        };
      });

      const limitedUsers = arrayUsers.slice(0, 5);
      console.log(limitedUsers);
      const vectorGPTService = new VectorGPTService();

      for (const user of limitedUsers) {
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
      }

      ctx.reply(
        "The data of the first 3 users has been processed and evaluated."
      );
    } catch (error: any) {
      console.error("Error processing the Excel file:", error.message);
      ctx.reply(
        "Failed to fetch or parse the Excel file. Please make sure the URL is correct and the file is accessible."
      );
    }
  }
});

export default bot;
