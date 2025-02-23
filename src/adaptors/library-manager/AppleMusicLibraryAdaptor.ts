import fs from "fs/promises";
import { load } from "cheerio";
import { LibraryManagerAdaptor } from "./LibraryManagerAdaptor.interface";
import { LibraryTrack } from "@/types/LibraryTrack";

/**
 * Adaptor class for parsing Apple Music library XML files.
 * You can generate this file by going to Music > Library > Export Library...
 */
export class AppleMusicLibraryAdaptor implements LibraryManagerAdaptor {
  constructor(private readonly xmlPath: string) {}
  /**
   * Extracts track information from an Apple Music XML library file
   * @returns Array of parsed track objects
   */
  async getTracks(): Promise<LibraryTrack[]> {
    const xml = await fs.readFile(this.xmlPath, "utf-8");
    const $ = load(xml, { xmlMode: true });
    const tracks: LibraryTrack[] = [];

    // Find all track dictionaries within the Tracks key
    $('dict:has(key:contains("Tracks")) > dict > dict').each((_, trackDict) => {
      const xmlTrack = $(trackDict);

      /**
       * Helper to get value after a specific key
       * @param key - The key to search for
       * @returns The value after the key if found
       */
      const getValue = (key: string): string | undefined => {
        const keyEl = xmlTrack
          .find("key")
          .filter((_, el) => $(el).text() === key);
        return keyEl.next().text();
      };

      // Only process if it's a music file
      if (getValue("Kind")?.includes("audio")) {
        const track: LibraryTrack = {
          platformTrackId: getValue("Persistent ID") || "0",
          title: getValue("Name") || "",
          artist: getValue("Artist") || "",
          album: getValue("Album") || "",
          genre: getValue("Genre"),
          year: getValue("Year")
            ? parseInt(getValue("Year") || "0")
            : undefined,
          totalTime: getValue("Total Time")
            ? parseInt(getValue("Total Time") || "0") / 1000
            : undefined,
          location: decodeURIComponent(
            getValue("Location")?.replace("file://", "") || ""
          ),
        };

        if (track.location) {
          tracks.push(track);
        }
      }
    });

    return tracks;
  }
}
