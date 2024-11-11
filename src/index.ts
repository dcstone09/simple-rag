import { ChatAnthropic } from "@langchain/anthropic";
import { PlaywrightWebBaseLoader } from "@langchain/community/document_loaders/web/playwright";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";

const llm = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
  temperature: 0
});

const urls = [
  "https://docs.nestjs.com/controllers",
  "https://docs.nestjs.com/modules",
  "https://docs.nestjs.com/providers",
  "https://docs.nestjs.com/middleware",
  "https://docs.nestjs.com/exception-filters",
  "https://docs.nestjs.com/pipes",
  "https://docs.nestjs.com/guards",
  "https://docs.nestjs.com/interceptors",
  "https://docs.nestjs.com/custom-decorators"
];

const loadedDocs = (await Promise.all(urls.map(async (url) => {
  const loader = new PlaywrightWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    }
  });
  
    return loader.load();
  })
)).flat();

console.log(loadedDocs.length);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const allSplits = await splitter.splitDocuments(loadedDocs);

console.log(allSplits.length);

const inMemoryVectorStore = await MemoryVectorStore.fromDocuments(
  allSplits,
  new OpenAIEmbeddings()
);

console.log(inMemoryVectorStore)

const vectorStoreRetriever = inMemoryVectorStore.asRetriever({
  k: 6,
  searchType: "similarity",
});


const ragPrompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

const runnableRagChain = RunnableSequence.from([
  {
    context: vectorStoreRetriever.pipe(formatDocumentsAsString),
    question: new RunnablePassthrough(),
  },
  ragPrompt,
  llm,
  new StringOutputParser(),
]);

for await (const chunk of await runnableRagChain.stream(
  "What are controllers used for?"
)) {
  console.log(chunk);
}
