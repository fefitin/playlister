import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";

export const chroma = new Chroma(
  new OllamaEmbeddings({
    model: "nomic-embed-text",
  }),
  {
    collectionName: process.env.CHROMA_COLLECTION_NAME,
    url: process.env.CHROMA_URL,
  }
);
