import { Nilsimsa } from "nilsimsa";
import { load } from "cheerio";
import { SearxngSearch } from "@langchain/community/tools/searxng_search";
import { LibraryTrack } from "@/types/LibraryTrack";
import { TrackContextProviderAdaptor } from "./TrackContextProviderAdaptor";

type GeniusSearchHit = {
  result: {
    primary_artist: {
      name: string;
    };
    title: string;
  };
  type: string;
};

type SearxngGoogleSearchResult = {
  snippet: string;
  content: string;
};

export class GeniusContextProvider implements TrackContextProviderAdaptor {
  constructor(private readonly apiKey: string) {}

  /**
   * Gets context information for a track from Genius API
   * @param track The library track to get context for
   * @returns Context information including title, album, artist, description, release date, lyrics and BPM
   */
  async getContext(track: LibraryTrack) {
    const geniusTrackId = await this.getGeniusSongId(track);
    return this.getInfoForSong(geniusTrackId);
  }

  /**
   * Searches for a song on Genius and returns its ID
   * Uses fuzzy matching with Nilsimsa hashing to find the best match
   * @param track The library track to search for
   * @returns The Genius song ID
   * @throws Error if no match is found or search fails
   */
  async getGeniusSongId(track: LibraryTrack) {
    const hashArtist = new Nilsimsa(track.artist.toLocaleLowerCase()).digest(
      "hex"
    );
    const hashTitle = new Nilsimsa(track.title.toLocaleLowerCase()).digest(
      "hex"
    );

    const query = encodeURIComponent(`${track.title} ${track.artist}`);
    const response = await fetch(`https://api.genius.com/search?q=${query}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    const data = await response.json();
    if (data.meta.status !== 200) {
      throw new Error("Failed to perform Genius search");
    }

    const hits = data.response.hits;
    const results = hits.filter((hit: GeniusSearchHit) => {
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
      const titleThreshold = 50;

      return (
        hit.type === "song" &&
        compareArtist > artistThreshold &&
        compareTitle > titleThreshold
      );
    });

    if (!results.length) {
      throw new Error("Failed to find song in Genius");
    }

    return results[0].result.id;
  }

  /**
   * Fetches detailed song information from Genius API
   * @param geniusSongId The Genius song ID to fetch information for
   * @returns Object containing song details including title, album, artist, description, release date, lyrics and BPM
   */
  async getInfoForSong(geniusSongId: string) {
    const query = await fetch(
      `https://api.genius.com/songs/${geniusSongId}?text_format=plain`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GENIUS_API_KEY}`,
        },
      }
    );
    const response = await query.json();
    const bpm = await this.getSongBPM(
      response.response.song.title,
      response.response.song.primary_artist.name
    );
    return {
      title: String(response.response.song.title),
      album: String(response.response.song.album.name),
      artist: String(response.response.song.primary_artist.name),
      description: String(response.response.song.description.plain),
      releaseDate: String(response.response.song.release_date),
      lyrics: await this.extractSongLyricsFromURL(
        String(response.response.song.url)
      ),
      bpm,
    };
  }

  /**
   * Searches for song BPM information using SearxNG search
   * @param title The song title to search for
   * @param artist The artist name to search for
   * @returns String containing BPM information from search results
   */
  async getSongBPM(title: string, artist: string) {
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
    return outputArray
      .map((item: SearxngGoogleSearchResult) => item.snippet)
      .join("\n");
  }

  /**
   * Extracts lyrics from a Genius song page
   * @param url The Genius song page URL
   * @returns The extracted and cleaned lyrics text
   */
  async extractSongLyricsFromURL(url: string) {
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);
    const lyrics = $("[data-lyrics-container]")
      .html()
      ?.replace(/(<br>|<br \/>|<br\/>)/g, "\n")
      .replace(/<[^>]*>/g, "");
    return String(lyrics);
  }
}
