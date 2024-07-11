import openai from "../openai";
import pinecone from "../pinecone";
import { userData } from "./types/userData";

let { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const LangchainOpenAI = require("@langchain/openai").OpenAI;
let { loadQAStuffChain } = require("langchain/chains");
let { Document } = require("langchain/document");
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "embedding-001", // 768 dimensions
});

const indexName = "nfac-hackaton";
const index = pinecone.index(indexName);

class VectorGPTService {
  async mapPointsToCategory(points: number): Promise<string> {
    if (points < 20) {
      return "hell-no";
    } else if (points >= 20 && points < 40) {
      return "no";
    } else if (points >= 40 && points < 60) {
      return "idk";
    } else if (points >= 60 && points < 80) {
      return "yes";
    } else if (points >= 80) {
      return "hell-yes";
    } else {
      return "Invalid points";
    }
  }

  async createTotalMarks(
    userJSONdata: userData,
    neededSkills: string
  ): Promise<any> {
    let points = 50;
    if (
      userJSONdata.availabilityInAlmaty === false ||
      userJSONdata.gitHubHandle === "" ||
      (userJSONdata.phoneNumber.length === 0 && userJSONdata.email === "") ||
      userJSONdata.programmingExperienceDescription === "" ||
      userJSONdata.pastProgrammingProjects === ""
    ) {
      points = 0;
      return points;
    }

<<<<<<< HEAD
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    if (urlRegex.test(userJSONdata.linkedInLink)) {
      points += 2;
    }
    if (userJSONdata.cv) {
      points += 5;
    }

    // TODO: Check if user has projects in Github

    const {
      fullName,
      email,
      birthDate,
      phoneNumber,
      willingToParticipateOnPaidBasis,
      telegramHandle,
      socialMediaLinks,
      // educationalPlacement, specialtyAtUniversity, jobPlacement, QUITE USELESS BUT MAYBE
      availabilityInAlmaty,
      needAccommodationInAlmaty,
      gitHubHandle,
      ...prompt
    } = userJSONdata;
    console.log("Prompt:", prompt);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `
=======
    async createTotalMarks(userJSONdata: userData, neededSkills : string) : Promise<any> { 
        let points = 50;
        if(userJSONdata.availabilityInAlmaty === false || 
            userJSONdata.gitHubHandle === '' || 
        (userJSONdata.phoneNumber.length === 0 && userJSONdata.email === '') || 
        userJSONdata.programmingExperienceDescription === '' || 
        userJSONdata.pastProgrammingProjects === ''){
            points = 0;
            let yesOrNo = "hell-no"
            let opinionAboutParticipant = "Нет важных полей для проверки"
            return { yesOrNo, points, opinionAboutParticipant };
        }
    
        const urlRegex = /^(http|https):\/\/[^ "]+$/;
        if(urlRegex.test(userJSONdata.linkedInLink)) {
            points += 2;
        }
        if(userJSONdata.cv){
            points += 5;
        }
        
        // TODO: Check if user has projects in Github
    
    
        const { fullName, email, birthDate, phoneNumber, willingToParticipateOnPaidBasis, 
            telegramHandle, socialMediaLinks, 
            // educationalPlacement, specialtyAtUniversity, jobPlacement, QUITE USELESS BUT MAYBE
            availabilityInAlmaty, needAccommodationInAlmaty, gitHubHandle,  ...prompt } = userJSONdata;
            console.log('Prompt:', prompt);
            try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `
>>>>>>> c376daf1d8c674e1d17c3ed5ea7f56c7e8bab320
                        Вы — автоматический проверяющий для летнего инкубатора nfactorial по программированию. Ваша задача — оценить кандидата по нескольким критериям и решить подходит ли он для дальнейшего прохождения. Вы смотрите критерии и ставите балл за этот критерий, относительно того, как он подходит. Учтите также, что большая часть полученных данных может получать больше и меньше баллов относительно запроса Ментора: "${neededSkills}".Ответ должен быть строго в формате JSON объекта и не должен включать никакого дополнительного текста. Критерии и максимальные баллы за них следующие:
                        
                        2. Опыт программирования относительно менторского запроса. От -30 до 20 баллов.
                        3. Прошлые проекты программирования (оценка относительно запроса ментора). От -20 до 10 баллов.
                        4. Достижения (любые, проверка на личность). От -10 до 5 баллов.
                        5. Место работы (если IT работа +10 баллов)
                        
                        На основе приведённых данных кандидата и нужных навыков, оцените его и верните JSON с баллами по каждому критерию и общим результатом. Также добавьте своё мнение о кандидате, опираясь на информацию, а не на баллы.
                        
                        Пример данных кандидата: {
                            "programmingSkillLevel": "Имею хорошие базовые навыки на уровне студента ИТ-университета",
                            "cv": "https://example.com/cv/ivan_ivanov.pdf",
                            "educationalPlacement": "KBTU",
                            "specialtyAtUniversity": "Информационные системы",
                            "jobPlacement": "Репетитор математики",
                            "programmingExperienceDescription": "У меня начальный уровень программирования. Знаю питон и училась питону 3 месяца, несколько месяцев обучалась с++",
                            "pastProgrammingProjects": "Нет",
                            "bestAchievements": "Победительница iqanat. Вошла в топ 10 лучших стартап проектов в своем городе. Вела исследование на тему распада полипропилена в этиленгликоле. Получила 200 тыс ТГ в конкурсе видеороликов на тему науки в жизни студентов",
                        }
                        
                        Структура JSON ответа должна быть как в этои примере: Пример JSON ответа:
                        {
                          "programmingExperience": 3,
                          "pastProjects": -20,
                          "achievements": 10,
                          "jobPlacement": 6,
                          "totalScore": 17,
                          "opinionAboutParticipant": "Под вопросом"
                        }
                        `,
          },
          {
            role: "user",
            content: `
                        Данные кандидата: {
                            ${JSON.stringify(prompt)}
                        }
                        `,
          },
        ],
        stream: false,
      });

      let messageContent = response.choices[0]?.message?.content || null;
      console.log("Received message content:", messageContent);

      if (!messageContent) {
        throw new Error("No content received from OpenAI");
      }

      // Extracting JSON response from OpenAI
      const jsonMessage = JSON.parse(
        messageContent.replace(/```json|```/g, "").trim()
      );
      console.log("GPT response:", jsonMessage);

      const totalScore = Number(jsonMessage?.totalScore);
      if (isNaN(totalScore)) {
        throw new Error(
          `Invalid totalScore received from OpenAI: ${jsonMessage?.totalScore}`
        );
      }
      const opinionAboutParticipant = jsonMessage?.opinionAboutParticipant;

      // Adjusting points based on OpenAI evaluation
      points += totalScore;

      const yesOrNo = await this.mapPointsToCategory(points);

      return { yesOrNo, points, opinionAboutParticipant };
    } catch (error) {
      throw new Error(
        `Error processing with OpenAI: ${(error as Error).message}`
      );
    }
<<<<<<< HEAD
  }
=======

    async saveToVectorDB(userJSONdata: userData, mentorsComment: string) {
        
    }


>>>>>>> c376daf1d8c674e1d17c3ed5ea7f56c7e8bab320
}

export default VectorGPTService;
