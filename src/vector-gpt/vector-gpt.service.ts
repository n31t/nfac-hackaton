import openai from "../openai";
import pinecone from "../pinecone";
import { CandidateData, UserData } from "./types/userData";

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
  /**
 * Maps a numerical score to a category.
 *
 * @param points - A number representing the score to be mapped.
 * @returns A promise that resolves to a string representing the category corresponding to the score.
 *
 * This function takes a numerical score as a parameter and maps it to a category.
 * The mapping from scores to categories is determined by a pre-defined set of rules.
 * For example, scores from 0 to 50 might be mapped to the category 'Low', scores from 51 to 80 to 'Medium', and scores from 81 to 100 to 'High'.
 * The function returns a promise that resolves to the category string.
 */
    async mapPointsToCategory(points: number): Promise<string> {
        if (points < 20) {
            return 'hell-no';
        } else if (points >= 20 && points < 40) {
            return 'no';
        } else if (points >= 40 && points < 60) {
            return 'idk';
        } else if (points >= 60 && points < 80) {
            return 'yes';
        } else if (points >= 80) {
            return 'hell-yes';
        } else {
            return 'Invalid points';
        }
    }

    /**
 * Calculates the total marks for a user based on their skills and the needed skills.
 *
 * @param userJSONdata - An object of type UserData, containing information about the user and their skills.
 * @param neededSkills - A string representing the skills that are needed.
 * @returns A promise that resolves to a number representing the total marks of the user.
 *
 * This function takes a user object and a string of needed skills as parameters.
 * It calculates the total marks for the user based on how many of the needed skills they have.
 * The function assumes that the user's skills are stored in the `skills` property of the user object,
 * and that the needed skills are provided as a comma-separated string.
 * The function returns a promise that resolves to the total marks, which is a number.
 */
    async createTotalMarks(userJSONdata: UserData, neededSkills : string) : Promise<any> { 
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
            const embeddedPrompt = await new GoogleGenerativeAIEmbeddings().embedQuery(JSON.stringify(prompt));
        
            console.log("Embedded Prompt:", embeddedPrompt); 
            let promptResponse = await index.query({
              vector: embeddedPrompt,
              topK: 1, // Retrieve more vectors initially
              includeMetadata: true,
            });


            try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `
                        Вы — автоматический проверяющий для летнего инкубатора nfactorial по программированию. Ваша задача — оценить кандидата по нескольким критериям и решить подходит ли он для дальнейшего прохождения. Вы смотрите критерии и ставите балл за этот критерий, относительно того, как он подходит. Учтите также, что большая часть полученных данных может получать больше и меньше баллов относительно запроса Ментора: "${neededSkills}".Ответ должен быть строго в формате JSON объекта и не должен включать никакого дополнительного текста. Критерии и максимальные баллы за них следующие:
                        
                        1. Опыт программирования относительно менторского запроса. От -30 до 20 баллов.
                        - -30: Нет опыта или навыки не соответствуют запросу вообще.
                        - -20 до -10: Минимальный опыт, сильно не соответствующий запросу.
                        - -10 до 0: Опыт есть, но он недостаточный и не соответствует запросу.
                        - 0 до 10: Соответствующий опыт, но незначительный.
                        - 10 до 20: Хороший и соответствующий запросу опыт.

                        2. Прошлые проекты программирования (оценка относительно запроса ментора). От -20 до 10 баллов.
                            - -20: Нет проектов или проекты не соответствуют запросу.
                            - -10: Проекты есть, но они минимальны и незначительны.
                            - 0: Небольшие проекты, частично соответствующие запросу.
                            - 5: Проекты средней сложности, соответствующие запросу.
                            - 10: Хорошие проекты, полностью соответствующие запросу.

                        3. Достижения (любые, проверка на личность). От -10 до 5 баллов.
                            - -10: Нет достижений или они негативны.
                            - 0: Нет значительных достижений.
                            - 1 до 3: Есть достижения, но незначительные.
                            - 4 до 5: Значительные достижения, положительно влияющие на личность.

                        4. Место работы (если IT работа +10 баллов)
                            - 0: Не в IT сфере.
                            - 10: В IT сфере.

                        
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
                        Cхожие данные кандидата с комментарием от ментора: {
                          ${JSON.stringify(promptResponse)}
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
  }

  /**
 * Saves a user's message to a vector database.
 *
 * @param user - An object of type UserData, containing information about the user.
 * @param message - A string representing the message to be saved.
 * @returns A promise that resolves when the message has been successfully saved to the database.
 *
 * This function takes a user object and a message string as parameters.
 * It transforms the message into a vector representation using a pre-trained model.
 * The vector representation of the message, along with the user's information, is then saved to a vector database.
 * This allows for efficient similarity searches in the database.
 */
  async saveToVectorDB(user: UserData, message: string) {
    // Create a text string from the user's data and the message
    const text = `${user} ${message}`;

    // Generate an embedding for this text
    const embedding = await embeddings.embedDocuments([text]);

    // Flatten the embedding
    const flattenedEmbedding = embedding.flat();

    // Upsert the data to the Pinecone index
    await index.upsert([{
        id: user.email,
        values: flattenedEmbedding,
        metadata: {
            ...user,
            message
        }
    }]);
}
}

export default VectorGPTService;
