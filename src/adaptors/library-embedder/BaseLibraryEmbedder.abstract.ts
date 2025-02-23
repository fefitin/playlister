import { AugmentedLibraryTrack } from "@/types/LibraryTrack";
import { LibraryEmbedderAdaptor } from "./LibraryEmbedderAdaptor.interface";

export abstract class BaseLibraryEmbedder implements LibraryEmbedderAdaptor {
  generateContent(track: AugmentedLibraryTrack): string {
    return `${track.themes ? `Themes: ${track.themes}` : ""}
${track.mood ? `Mood: ${track.mood}` : ""}
${track.bpm ? `BPM: ${track.bpm}` : ""}
${track.tempo ? `Tempo: ${track.tempo}` : ""}
${track.style ? `Style: ${track.style}` : ""}
${track.year ? `Year: ${track.year}` : ""}`.replace(/\n+/g, "\n");
  }

  abstract embedTrack(track: AugmentedLibraryTrack): Promise<void>;
  abstract retrieveTrackIds(query: string, limit: number): Promise<string[]>;
}
