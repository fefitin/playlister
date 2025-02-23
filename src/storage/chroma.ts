import dotenv from "dotenv";
dotenv.config();

import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";

export const chroma = new Chroma(
  new OllamaEmbeddings({
    model: process.env.CHROMA_EMBEDDING_MODEL,
  }),
  {
    collectionName: process.env.CHROMA_COLLECTION_NAME,
    url: process.env.CHROMA_URL,
  }
);
