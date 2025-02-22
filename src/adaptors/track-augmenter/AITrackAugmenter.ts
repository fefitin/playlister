import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { z } from "zod";
import { AugmentedLibraryTrack, LibraryTrack } from "@/types/LibraryTrack";
import { TrackAugmenterAdaptor } from "./TrackAugmenterAdaptor.interface";
import { TrackContextProviderAdaptor } from "../track-context-provider/TrackContextProviderAdaptor";

const SongInfoSchema = z.object({
  themes: z.string(),
  keywords: z.string(),
  mood: z.string(),
  bpm: z.number(),
  style: z.string(),
});

export class AITrackAugmenter implements TrackAugmenterAdaptor {
  constructor(
    private readonly model: BaseChatModel,
    private readonly contextProvider: TrackContextProviderAdaptor
  ) {}

  /**
   * Augments a track with additional information using AI
   * and add textual representation of tempo based on BPM
   * @param track Track library to augment
   * @returns Augmented track
   */
  async augmentTrack(track: LibraryTrack): Promise<AugmentedLibraryTrack> {
    const result = await this.getTrackInfo(track);
    const tempo = this.bpmToTempo(result.bpm);
    return {
      ...track,
      ...result,
      tempo,
    };
  }

  /**
   * Gets enriched song information by analyzing track context
   * Extracts themes, keywords, mood, BPM and style using AI
   * @throws error if context cannot be retrieved
   * @param track Track library to augment
   * @returns Augmented track
   */
  async getTrackInfo(track: LibraryTrack) {
    let context;
    try {
      context = await this.contextProvider.getContext(track);
    } catch (err) {
      throw new Error(
        `Can't get context for ${track.title} by ${track.artist}: ${(err as Error).message}`
      );
    }

    const parse = `Use the provided context to return a JSON with the following structure:
{"themes":"", "keywords":"", "mood":"", "bpm": 00, "style": ""}
Keywords and themes should be related to the song lyrics. Do not include the artist name or song title in the themes or keywords.
Do not generate any other text than the JSON.

# Context
${Object.keys(context)
  .map((key) => `## ${key}\n${context[key]}`)
  .join("\n")}`;

    const structuredModel = this.model.withStructuredOutput(SongInfoSchema);
    return structuredModel.invoke([{ role: "user", content: parse }]);
  }

  /**
   * Converts numeric BPM to descriptive tempo string
   * Maps BPM ranges to tempo descriptions from "very slow" to "very fast"
   */
  bpmToTempo(bpm: number) {
    if (bpm < 50) return "very slow";
    if (bpm < 70) return "slow";
    if (bpm < 100) return "moderate";
    if (bpm < 120) return "fast";
    return "very fast";
  }
}
