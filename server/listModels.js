require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  const models = await genAI.listModels();

  for (const model of models) {
    console.log(model.name);
  }
}

run().catch(console.error);