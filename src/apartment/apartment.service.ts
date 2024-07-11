import { Prisma, PrismaClient } from "@prisma/client";
import openai from "../openai";
import pinecone from "../pinecone";

let { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const LangchainOpenAI = require("@langchain/openai").OpenAI;
let { loadQAStuffChain } = require("langchain/chains");
let { Document } = require("langchain/document");
const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "embedding-001", // 768 dimensions
});

const indexName = 'homespark3';
const index = pinecone.index(indexName);

class ApartmentService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getAllApartments() {
        return this.prisma.apartment.findMany();
    }

    async getApartmentById(id: number) {
        return this.prisma.apartment.findUnique({
            where: {
                id: id
            }
        })
    }

    async getApartmentByLink(link: string) {
        return this.prisma.apartment.findUnique({
            where: {
                link: link
            }
        })
    }

    async getBuyApartments() {
        return this.prisma.apartment.findMany({
            where: {
                type: 'buy'
            }
        })
    }

    async getRentApartments() {
        return this.prisma.apartment.findMany({
            where: {
                type: 'rent'
            }
        })
    }

    async getDailyApartments() {
        return this.prisma.apartment.findMany({
            where: {
                type: 'daily'
            }
        })
    }

    // private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    //     const chunks: T[][] = [];
    //     for (let i = 0; i < array.length; i += chunkSize) {
    //         chunks.push(array.slice(i, i + chunkSize));
    //     }
    //     return chunks;
    // }

    // private async sendChunkedRequest(apartmentType: string, userPrompt: string, chunk: any[]): Promise<{ id: number, reason: string }[]> {
    //     const promptType = apartmentType === "rent" ? "Аренда с оплатой в месяц" :
    //                        apartmentType === "daily" ? "Аренда на день" : "Купить недвижимость";

    //     const response = await openai.chat.completions.create({
    //         model: 'gpt-3.5-turbo',
    //         messages: [
    //             {
    //                 role: 'system',
    //                 content: `
    //                     Вы — профессиональный агент по недвижимости, хорошо знакомый с Алматы, который идеально знает расположение абсолютно всего в городе. Тип запроса: ${promptType}. Ты должен предоставить от 1 до 20 квартир на твое усмотрение. На основе предоставленных данных о квартирах и запроса пользователя, создайте JSON-массив, который включает объекты с следующими данными:
    //                     apartmentId и reason. Ответ должен быть строго в формате JSON массива и не должен включать никакого дополнительного текста.
    //                     JSON массив должен выглядеть следующим образом:
    //                     [
    //                         {
    //                             "apartmentId": 123,
    //                             "reason": "Причина выбора этой квартиры, основанная на запросе пользователя и также плюсы этой квартиры, относительно других"
    //                         }
    //                     ]
    //                     Данные о каждой квартире представлены в следующем формате:
    //                     {
    //                         "id": Int,                    // Уникальный идентификатор квартиры (целое число)
    //                         "price": Int,                 // Цена квартиры (целое число)
    //                         "location": String,           // Расположение квартиры (строка)
    //                         "floor": String,              // Этаж квартиры (строка)
    //                         "characteristics": Json       // Характеристики квартиры (JSON объект)
    //                     }
    //                 `
    //             },
    //             {
    //                 role: 'user',
    //                 content: `
    //                 Запрос пользователя: ${userPrompt}
    //                 Данные о квартирах: ${JSON.stringify(chunk)}
    //                 `
    //             }
    //         ],
    //         stream: false
    //     });

    //     let messageContent = response.choices[0]?.message?.content || null;
    //     console.log('Received message content:', messageContent);

    //     if (!messageContent) {
    //         throw new Error('No content received from OpenAI');
    //     }

    //     // Remove possible formatting characters
    //     messageContent = messageContent.replace(/```json|```/g, '').trim();

    //     return JSON.parse(messageContent);
    // }

    // async getRecommendations(apartmentType: string, userPrompt: string): Promise<{ id: number, reason: string }[]> {
    //     try {
    //         const apartments = await this.prisma.apartment.findMany({
    //             where: {
    //                 type: apartmentType
    //             }
    //         });

    //         const apartmentsFiltered = apartments.map(apartment => {
    //             const { photos, site, type, updatedAt, lastChecked, link, number, ...rest } = apartment;
    //             return rest;
    //         });

    //         const chunkSize = 35; // Adjust the chunk size based on token limit considerations
    //         const chunks = this.chunkArray(apartmentsFiltered, chunkSize);

    //         let recommendations: { id: number, reason: string }[] = [];

    //         for (const chunk of chunks) {
    //             const chunkRecommendations = await this.sendChunkedRequest(apartmentType, userPrompt, chunk);
    //             recommendations = recommendations.concat(chunkRecommendations);
    //         }

    //         return recommendations;
    //     } catch (err) {
    //         console.error('Error getting recommendations:', err);
    //         throw err;
    //     }
    // }


    // async generateEmbedding(prompt: string, classify: string): Promise<any[]> {
    //     const embeddedPrompt = await new GoogleGenerativeAIEmbeddings().embedQuery(prompt);
        
    //     console.log("Embedded Prompt:", embeddedPrompt); 
        
    //     let promptResponse = await index.query({
    //         vector: embeddedPrompt,
    //         topK: 100,
    //         includeMetadata: true,
    //         filter: {
    //             type: classify 
    //         }
    //     });
    
    //     console.log("Prompt Response:", JSON.stringify(promptResponse, null, 2)); // Log the prompt response
    
    //     const results = promptResponse.matches.map((match) => {
    //         if (match.metadata) {
    //             const { site, lastChecked, type, ...rest } = match.metadata;
    //             return rest;
    //         }
    //         return null; // or return an empty object {} or any other default value
    //     });
    
    //     return results;
    // }
    async generateEmbedding(prompt: string, classify: string, minPrice: number, maxPrice: number, minRooms: number, maxRooms: number): Promise<any[]> {
        const embeddedPrompt = await new GoogleGenerativeAIEmbeddings().embedQuery(prompt);
        
        console.log("Embedded Prompt:", embeddedPrompt); 
        
        let promptResponse = await index.query({
            vector: embeddedPrompt,
            topK: 150, // Retrieve more vectors initially
            includeMetadata: true,
            filter: {
                type: classify,
                price: {"$gte": minPrice, "$lte": maxPrice} // Test var
            }
        });
    
        // console.log("Prompt Response:", JSON.stringify(promptResponse, null, 2)); 
    
        const results = promptResponse.matches
            .filter((match) => {
                if (!match.metadata) return false;
                
                const price = Number(match.metadata.price);
                const floorInfo = match.metadata.floor.toString(); // Convert floorInfo to string

                // Extract number of rooms from floor info
                const roomsMatch = floorInfo.match(/(\d+)-комн/);
                const rooms = roomsMatch ? parseInt(roomsMatch[1], 10) : null;

                return price >= minPrice && price <= maxPrice && rooms !== null && rooms >= minRooms && rooms <= maxRooms;
            })
            .slice(0, 40) // Take only the first 40 matches after filtering
            .map((match) => {
                if (!match.metadata) {
                    return null;
                }
                const { site, lastChecked, type, ...rest } = match.metadata;
                return rest;
            });
    
        return results;
    }

    async getFineTextEmbedding(prompt: string, rooms: string): Promise<string> {
        switch (rooms) {
            case('1-4 комн.'):
                rooms = '';
                break;
            case('1'):
                rooms = '1-комн.';
                break;
            case('2'):
                rooms = '2-комн.';
                break;
            case('3'):
                rooms = '3-комн.';
                break;
            case('4'):
                rooms = '4-комн.';
                break;
        }
            
        const newPrompt = prompt + " " + rooms;
        const response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: `
                                Вы — профессионал в переписывании абсолютно любых абстрактных и не абстрактных запросов по поиску квартир в запрос, который будет идеально понятен векторной базе данных Pinecone.
                                Ты должен написать такой запрос, который выдаст максимально приближенные значения по векторной базе данных квартир. Например: "Квартиры возле КБТУ" перефразируется в "Квартиры возле Толе Би 59", "Хорошие квартиры" перефразируется в "Квартиры с  Ремонт: Современный ремонт и видом на город", "Квартиры с хорошим ремонтом" перефразируется в "Квартиры с  "Ремонт: Современный ремонт"", "Дешевые квартиры возле метро" перефразируется в "Квартиры ценой до 300000 возле станции метро", "Квартиры в Ауэзовском районе" перефразируется в "Квартиры в Ауэзовским районе", "Квартиры в Бостандыкском районе" перефразируется в "Квартиры в Бостандыкском районе". "Квартиры с стиральной машиной и стульями" в "Квартиры с Стулья: есть, Стулья: есть", "Большая квартира" в "Квартира с площадью более 100 м²", "Квартиры трехкомнатные" в "Квартиры с Комнатность: 2-комн.", "Квартиры с балконом" в "Квартиры с Балкон: есть", "Квартиры с балконом и стиральной машиной" в "Квартиры с Балкон: есть, Стиральная машина: есть", "Квартиры с балконом и стиральной машиной и стульями" в "Квартиры с Балкон: есть, Стиральная машина: есть, Стулья: есть".
                                Ответ должен быть строго в формате JSON в виде переписанного запроса или такого же, если запрос уже идеален.
                                JSON массив должен выглядеть следующим образом:
                                {
                                    
                                        "newPrompt": "Сам запрос, который идеально подходит для векторной базы данных Pinecone"
                                    
                                }
                                Данные о каждой квартире в векторной базе данных Pinecone представлены в следующем формате:
                                {
                                    characteristics: [ "Код объекта: 10731980", "Комнатность: 2-комн.", "Общая площадь: 71 м²", "Ремонт: Современный ремонт", "Количество спален: 2", "Санузел: Раздельный", "Подключённые сервисы: телефон, интернет, кабельное телевидение", "Материал окон: Пластиковые", "Диван: есть", "Телевизор: есть", "Плита: Отсутствует", "Посудомоечная машина: нет", "Стиральная машина: нет", "Год постройки: 2020", "Этаж / Этажность: 5 из 10", "Стены: Монолитные", "Двор: открытый двор", "Парковка: наземный паркинг" ] // Характеристики квартиры
                                    description: "Описание квартиры" // Описание квартиры
                                    floor: "2-комн. квартира, 71м², 5/10 этаж" // Этаж квартиры
                                    lastChecked: "Tue Jul 02 2024 21:22:46 GMT+0500 (West Kazakhstan Time)" // Дата последней проверки
                                    link: "https://almaty.etagi.com/realty_rent/10731980/" // Ссылка на квартиру
                                    location: "р-н Наурызбайский, ул. Жунисова, 4\n к18 (13.2 км до центра)" // Расположение квартиры
                                    price: 250000 // Цена квартиры
                                    site: "etagi" // Сайт, на котором находится квартира
                                    type: "rent" // Тип квартиры (аренда, продажа, посуточно)
                                }
                            `
                        },
                        {
                            role: 'user',
                            content: `
                            Запрос пользователя: ${newPrompt}
                            `
                        }
                    ],
                    stream: false
                });

        let messageContent = response.choices[0]?.message?.content || null;
        console.log('Received message content:', messageContent);
        
        if (!messageContent) {
            throw new Error('No content received from OpenAI');
        }
        // messageContent = messageContent.replace(/```json|```/g, '').trim();
        
        // return JSON.parse(messageContent);
        return messageContent.trim()
    }

    async getRecommendations(prompt: string, classify: string, minPrice: number, maxPrice: number, rooms: string): Promise<any[]> {
        let finePrompt = await this.getFineTextEmbedding(prompt, rooms);
        let minRooms = 1
        let maxRooms = 100
        console.log(rooms)
            switch (rooms) {
                case('1'):
                    minRooms = 1;
                    maxRooms = 1;
                    break;
                case('2'):
                    minRooms = 2;
                    maxRooms = 2;
                    break;
                case('3'):
                    minRooms = 3;
                    maxRooms = 3;
                    break;
                case('4'):
                    minRooms = 4;
                    maxRooms = 4;
                    break;
        }
        console.log(minRooms, maxRooms)
        const firstApartments = await this.generateEmbedding(finePrompt, classify, minPrice, maxPrice, minRooms, maxRooms);
        console.log('First apartments:', firstApartments)

        const newPrompt = prompt + " " + rooms;
        const response = await openai.chat.completions.create({
                    model: 'gpt-4o', //Maybe pomenayu na 4-o
                    messages: [
                        {
                            role: 'system',
                            content: `
                                Вы — профессиональный агент по недвижимости, хорошо знакомый с Алматы, который идеально знает расположение абсолютно всего в городе. Тип запроса: ${classify}. Ты должен предоставить от 1 до 20 квартир на твое усмотрение. Если же нет даже близко подходящих под описание квартир, то выводи пустой JSON. Если по запросу нет никаких квартир, то можешь предоставить альтернативы, если у них сходится какой-то пункт с запросом или квартира имеет очень низкую цену на метр квадрат. Если же в запросе спрашивается также о квартирах для житья с животными, то там где они не запрещены - потенциальные кандитаты для проживания с животными. На основе предоставленных данных о квартирах и запроса пользователя, создайте JSON-массив, который включает объекты с следующими данными:
                                link и reason. Ответ должен быть строго в формате JSON массива и не должен включать никакого дополнительного текста.
                                JSON массив должен выглядеть следующим образом:
                                [
                                    {
                                        "link": "Тут ссылка на квартиру, взятая из поля квартиры link",
                                        "reason": "Причина выбора этой квартиры, основанная на запросе пользователя и также плюсы и минусы квартиры относительно средних показателей или других квартир"
                                    }
                                ]
                                Данные о каждой квартире представлены в следующем формате:
                                {
                                    characteristics: [ "Код объекта: 10731980", "Комнатность: 2-комн.", "Общая площадь: 71 м²", "Ремонт: Современный ремонт", "Количество спален: 2", "Санузел: Раздельный", "Подключённые сервисы: телефон, интернет, кабельное телевидение", "Материал окон: Пластиковые", "Диван: есть", "Телевизор: есть", "Плита: Отсутствует", "Посудомоечная машина: нет", "Стиральная машина: нет", "Год постройки: 2020", "Этаж / Этажность: 5 из 10", "Стены: Монолитные", "Двор: открытый двор", "Парковка: наземный паркинг" ] // Характеристики квартиры JSON
                                    description: "Описание квартиры" // Описание квартиры
                                    floor: "2-комн. квартира, 71м², 5/10 этаж" // Этаж квартиры
                                    link: "https://almaty.etagi.com/realty_rent/10731980/" // Ссылка на квартиру
                                    location: "р-н Наурызбайский, ул. Жунисова, 4\n к18 (13.2 км до центра)" // Расположение квартиры
                                    price: 250000 // Цена квартиры
                                }
                            `
                        },
                        {
                            role: 'user',
                            content: `
                            Запрос пользователя: ${newPrompt}
                            Данные о квартирах: ${JSON.stringify(firstApartments)}
                            `
                        }
                    ],
                    stream: false
                });
        let messageContent = response.choices[0]?.message?.content || null;
        console.log('Received message content:', messageContent);

        if (!messageContent) {
            throw new Error('No content received from OpenAI');
        }
        messageContent = messageContent.replace(/```json|```/g, '').trim();
        
        return JSON.parse(messageContent);
    }
    
    getMightLikeApartments = async (prompt: string, classify: string, minPrice: number, maxPrice: number, rooms: string): Promise<any[]> => {
        switch (rooms) {
            case('1-4 комн.'):
                rooms = '';
                break;
            case('1'):
                rooms = '1-комн.';
                break;
            case('2'):
                rooms = '2-комн.';
                break;
            case('3'):
                rooms = '3-комн.';
                break;
            case('4'):
                rooms = '4-комн.';
                break;
        }
        let minRooms = 1
        let maxRooms = 100
        if(rooms != "") {
            switch (rooms) {
                case('1-комн.'):
                    minRooms = 1;
                    maxRooms = 1;
                    break;
                case('2-комн.'):
                    minRooms = 2;
                    maxRooms = 2;
                    break;
                case('3-комн.'):
                    minRooms = 3;
                    maxRooms = 3;
                    break;
                case('4-комн.'):
                    minRooms = 4;
                    maxRooms = 4;
                    break;
            }
        }
            
        const newPrompt = prompt + " " + rooms;
        const apartments = await this.generateEmbedding(newPrompt, classify, minPrice, maxPrice, minRooms, maxRooms);
        const results = apartments
        .slice(0, 30) // Take only the first 30 matches after filtering
        .map((apartment) => {
            if (!apartment.link) {
                return null;
            }
            return { link: apartment.link }; // Return only the link property
        });

        return results;
    }

}

export default ApartmentService;
