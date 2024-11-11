import { ChatAnthropic } from "@langchain/anthropic";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

const llm = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
  temperature: 0
});

async function loadNestJsDocs() {
  const loader = new CheerioWebBaseLoader(
    "https://docs.nestjs.com/controllers",
    {
      // Target the main content area of NestJS docs
      selector: "div.content",
    }
  );

  try {
    const docs = await loader.load();
    console.log("Loaded NestJS Controllers documentation:");
    console.log("Content length:", docs[0].pageContent.length);
    console.log("First 500 characters:");
    console.log(docs[0].pageContent.substring(0, 500));
    return docs[0].pageContent;
  } catch (error) {
    console.error("Error loading NestJS documentation:", error);
    throw error;
  }
}

async function main() {
  const docsContent = await loadNestJsDocs();
  // You can now use this content with your ChatAnthropic instance
  // For example:
  // const response = await llm.invoke("Summarize this: " + docsContent);
}

main().catch(console.error);

