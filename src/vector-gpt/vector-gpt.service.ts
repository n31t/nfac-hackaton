import openai from "../openai";
import pinecone from "../pinecone";

let { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const LangchainOpenAI = require("@langchain/openai").OpenAI;
let { loadQAStuffChain } = require("langchain/chains");
let { Document } = require("langchain/document");
const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "embedding-001", // 768 dimensions
});

const indexName = 'nfac-hackaton';
const index = pinecone.index(indexName);

function mapPointsToCategory(points: number): string {
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

async function createTotalMarks(userJSONdata: any) {
    let points = 50;
    
}

