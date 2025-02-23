import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";

export const chroma = new Chroma(
  new OllamaEmbeddings({
    model: "nomic-embed-text",
  }),
  {
    collectionName: "tracks",
    url: "http://localhost:8000",
  }
);
