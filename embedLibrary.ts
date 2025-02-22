import pg from "pg";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";
import type { Document } from "@langchain/core/documents";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
});

const vectorStore = new Chroma(embeddings, {
  collectionName: "songs",
  url: "http://localhost:8000",
});

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const client = await pool.connect();

const songs = await client.query("SELECT * FROM songs");
const docs: Document[] = [];
const ids: string[] = [];
for (const song of songs.rows) {
  const doc: Document = {
    pageContent: `Artist: ${song.artist}
${song.themes ? `Themes: ${song.themes}` : ""}
${song.mood ? `Mood: ${song.mood}` : ""}
${song.bpm ? `BPM: ${song.bpm}` : ""}
${song.tempo ? `Tempo: ${song.tempo}` : ""}
${song.style ? `Style: ${song.style}` : ""}
${song.year ? `Year: ${song.year}` : ""}`.replace(/\n+/g, "\n"),
    metadata: song,
  };

  docs.push(doc);
  ids.push(String(song.id));
}

const insert = await vectorStore.addDocuments(docs, {
  ids,
});
console.log(insert);
