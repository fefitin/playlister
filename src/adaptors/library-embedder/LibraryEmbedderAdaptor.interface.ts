import { AugmentedLibraryTrack } from "@/types/LibraryTrack";

export interface LibraryEmbedderAdaptor {
  /**
   * Generate the content that will be embedded for the track.
   * Not all fields are guaranteed to be present, only those
   * relevant to the retrieval process should be included.
   * @param track Track to embed
   * @returns Content for the track
   */
  generateContent(track: AugmentedLibraryTrack): string;

  /**
   * Embed the track
   * @param track Track to embed
   */
  embedTrack(track: AugmentedLibraryTrack): Promise<void>;
}
