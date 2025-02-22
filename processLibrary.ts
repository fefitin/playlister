import ollama from "ollama";
import { configDotenv } from "dotenv";
import { SearxngSearch } from "@langchain/community/tools/searxng_search";
import { load } from "cheerio";
import { Nilsimsa } from "nilsimsa";
import fs from "fs/promises";
import pg from "pg";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

configDotenv();

const SongInfoSchema = z.object({
  themes: z.string(),
  keywords: z.string(),
  mood: z.string(),
  bpm: z.number(),
  style: z.string(),
});

/*const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});*/

async function getContext(title: string, artist: string) {
  const hashArtist = new Nilsimsa(artist.toLocaleLowerCase()).digest("hex");
  const hashTitle = new Nilsimsa(title.toLocaleLowerCase()).digest("hex");

  const query = encodeURIComponent(`${title} ${artist}`);
  const response = await fetch(`https://api.genius.com/search?q=${query}`, {
    headers: {
      Authorization: `Bearer ${process.env.GENIUS_API_KEY}`,
    },
  });

  const data = await response.json();
  if (data.meta.status !== 200) {
    console.dir(data, { depth: null });
    throw new Error("Failed to get context");
  }

  const hits = data.response.hits;
  const results = hits.filter((hit) => {
    const hashHitArtist = new Nilsimsa(
      hit.result.primary_artist.name.toLocaleLowerCase()
    ).digest("hex");
    const hashHitTitle = new Nilsimsa(
      hit.result.title.toLocaleLowerCase()
    ).digest("hex");

    //compare returns [-128, 128]
    const compareArtist = Nilsimsa.compare(hashArtist, hashHitArtist);
    const compareTitle = Nilsimsa.compare(hashTitle, hashHitTitle);
    const artistThreshold = 80;
    const titleThreshold = 70;

    return (
      hit.type === "song" &&
      compareArtist > artistThreshold &&
      compareTitle > titleThreshold
    );
  });

  if (!results.length) {
    return null;
  }

  return getSongInfo(results[0].result.id);
}

async function getSongInfo(songId: string) {
  const query = await fetch(
    `https://api.genius.com/songs/${songId}?text_format=plain`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GENIUS_API_KEY}`,
      },
    }
  );
  const response = await query.json();
  const bpm = await getSongBPM(
    response.response.song.title,
    response.response.song.primary_artist.name
  );
  return {
    title: response.response.song.title,
    album: response.response.song.album.name,
    artist: response.response.song.primary_artist.name,
    description: response.response.song.description.plain,
    releaseDate: response.response.song.release_date,
    //url: response.response.song.url,
    lyrics: await getLyrics(response.response.song.url),
    bpm,
  };
}

async function getLyrics(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = load(html);
  const lyrics = $("[data-lyrics-container]")
    .html()
    ?.replace(/(<br>|<br \/>|<br\/>)/g, "\n")
    .replace(/<[^>]*>/g, "");
  return lyrics;
}

function bpmToTempo(bpm: number) {
  if (bpm < 50) return "very slow";
  if (bpm < 70) return "slow";
  if (bpm < 100) return "moderate";
  if (bpm < 120) return "fast";
  return "very fast";
}

async function getSongBPM(title: string, artist: string) {
  const tool = new SearxngSearch({
    params: {
      format: "json",
      engines: "google",
      numResults: 2,
    },
  });

  const query = `BPM song ${title} by ${artist}`;
  const output = await tool.invoke(query);
  const outputArray = JSON.parse(`[${output}]`);
  return outputArray.map((item) => item.snippet).join("\n");
}

async function songInfo(title: string, artist: string) {
  const context = await getContext(title, artist);
  if (!context) {
    throw new Error(`Cant get context for ${title} by ${artist}`);
  }

  const parse = `Use the provided context to return a JSON with the following structure:
{"themes":"", "keywords":"", "mood":"", "bpm": 00, "style": ""}
Keywords and themes should be related to the song lyrics. Do not include the artist name or song title in the themes or keywords.
Do not generate any other text than the JSON.

# Context
${Object.keys(context)
  .map((key) => `## ${key}\n${context[key]}`)
  .join("\n")}`;

  const result = await ollama.chat({
    model: "llama3.1:latest",
    messages: [{ role: "user", content: parse }],
    format: zodToJsonSchema(SongInfoSchema),
  });
  const json = JSON.parse(result.message.content);
  const output = { ...context, ...json };
  output.tempo = bpmToTempo(output.bpm);
  return output;
}

interface Track {
  trackId: number;
  name: string;
  artist: string;
  album: string;
  genre?: string;
  year?: number;
  totalTime?: number;
  location: string;
}

async function getTracksFromXML(xmlPath: string): Promise<Track[]> {
  const xml = await fs.readFile(xmlPath, "utf-8");
  const $ = load(xml, { xmlMode: true });
  const tracks: Track[] = [];

  // Find all track dictionaries within the Tracks key
  $('dict:has(key:contains("Tracks")) > dict > dict').each((_, trackDict) => {
    const $track = $(trackDict);

    // Helper to get value after a specific key
    const getValue = (key: string): string | undefined => {
      const keyEl = $track.find("key").filter((_, el) => $(el).text() === key);
      return keyEl.next().text();
    };

    // Only process if it's a music file
    if (getValue("Kind")?.includes("audio")) {
      const track: Track = {
        trackId: parseInt(getValue("Track ID") || "0"),
        name: getValue("Name") || "",
        artist: getValue("Artist") || "",
        album: getValue("Album") || "",
        genre: getValue("Genre"),
        year: getValue("Year") ? parseInt(getValue("Year") || "0") : undefined,
        totalTime: getValue("Total Time")
          ? parseInt(getValue("Total Time") || "0") / 1000
          : undefined,
        location: decodeURIComponent(
          getValue("Location")?.replace("file://", "") || ""
        ),
      };

      tracks.push(track);
    }
  });

  return tracks;
}

async function processTrack(track: Track, index: number, total: number) {
  const songQuery = `
    SELECT id
    FROM songs
    WHERE apple_music_track_id = $1
    LIMIT 1
  `;

  const insertQuery = `
    INSERT INTO songs (apple_music_track_id, title, artist, album, total_time, year, themes, keywords, mood, bpm, tempo, style)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `;

  const songResult = await client.query(songQuery, [track.trackId]);
  if (songResult.rows.length > 0) {
    console.log(
      `${index}/${total} Skipping ${track.name} by ${track.artist}: already exists`
    );
    return;
  }

  console.log(
    `${index}/${total} Getting info for ${track.name} by ${track.artist}...`
  );
  try {
    const info = await songInfo(track.name, track.artist);
    await client.query(insertQuery, [
      track.trackId,
      track.name,
      track.artist,
      track.album,
      track.totalTime,
      track.year,
      info.themes,
      info.keywords,
      info.mood,
      info.bpm,
      info.tempo,
      info.style,
    ]);
  } catch (err) {
    console.error((err as Error).message);
    await client.query(insertQuery, [
      track.trackId,
      track.name,
      track.artist,
      track.album,
      track.totalTime,
      track.year,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  }
}

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const client = await pool.connect();

const tracks = await getTracksFromXML("Library.xml");
const PARALLEL_LIMIT = 50;

for (let i = 0; i < tracks.length; i += PARALLEL_LIMIT) {
  const promises: Promise<void>[] = [];
  for (let j = 0; j < PARALLEL_LIMIT; j++) {
    const index = i + j;
    const track = tracks[index];
    if (track) {
      promises.push(processTrack(track, index + 1, tracks.length));
    }
  }
  await Promise.all(promises);
}
