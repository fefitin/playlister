import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
});

const vectorStore = new Chroma(embeddings, {
  collectionName: "songs",
  url: "http://localhost:8000",
});

const results = await vectorStore.similaritySearchWithScore(
  //"Summer Vibes Chill Upbeat Party Relaxed Joyful Energetic Feel-Good Tropical Happy",
  "Relaxation Socializing Leisure Summer/Vacation vibes Laid-back Upbeat (but not too energetic) Calm Friendly",
  2000
);

const songs: string[] = [];
for (const [doc, score] of results) {
  const song = `- ${doc.metadata.title} by ${doc.metadata.artist}
ID: ${doc.metadata.id}
${doc.metadata.mood ? `Mood: ${doc.metadata.mood}` : ""}
${doc.metadata.themes ? `Themes: ${doc.metadata.themes}` : ""}
${doc.metadata.style ? `Style: ${doc.metadata.style}` : ""}
${doc.metadata.tempo ? `Tempo: ${doc.metadata.tempo} (${doc.metadata.bpm} BPM)` : ""}
${doc.metadata.year ? `Year: ${doc.metadata.year}` : ""}`.replace(/\n+/g, "\n");
  songs.push(song);
}

console.log(songs.join("\n\n"));
