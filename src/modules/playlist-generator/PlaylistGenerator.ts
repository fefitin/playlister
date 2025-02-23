import { z } from "zod";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { LibraryEmbedderAdaptor } from "@/adaptors/library-embedder/LibraryEmbedderAdaptor.interface";
import { LibraryStorageAdaptor } from "@/adaptors/library-storage/LibraryStorageAdaptor.interface";
import { AugmentedLibraryTrack } from "@/types/LibraryTrack";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PlaylistManagerAdaptor } from "@/adaptors/playlist-manager/PlaylistManagerAdaptor.interface";

export class PlaylistGenerator {
  constructor(
    private readonly storage: LibraryStorageAdaptor,
    private readonly embedder: LibraryEmbedderAdaptor,
    private readonly model: BaseChatModel,
    private readonly playlistManager: PlaylistManagerAdaptor
  ) {}

  async generatePlaylist(name: string, prompt: string) {
    const trackIds = await this.embedder.retrieveTrackIds(prompt, 1000);
    const tracks = await Promise.all(
      trackIds.map((id) => this.storage.getTrackByPlatformId(id))
    );
    return this.generateWithAI(name, prompt, tracks);
  }

  private async generateWithAI(
    name: string,
    prompt: string,
    tracks: AugmentedLibraryTrack[]
  ) {
    const structuredModel = this.model.withStructuredOutput(
      z.object({
        trackIds: z.array(z.string()),
      })
    );

    const messages = this.generateMessages(name, prompt, tracks);
    const response = await structuredModel.invoke(messages);
    const trackIds = response.trackIds;

    try {
      await this.playlistManager.createPlaylist(name, trackIds);
    } catch (error) {
      console.error(`Failed to create playlist: ${(error as Error).message}`);
    }

    return Promise.all(
      trackIds.map((id) => this.storage.getTrackByPlatformId(id))
    );
  }

  private generateMessages(
    name: string,
    prompt: string,
    tracks: AugmentedLibraryTrack[]
  ) {
    const userPrompt = `# Name: ${name}\n# Description:\n${prompt}\n# Tracks\n${this.generatePromptContext(tracks)}`;
    return [
      new SystemMessage(
        `You are an expert DJ and music connoisseur. Your task is to generate playlists with twenty songs. You will be given a playlist name, a playlist description and a list of tracks. For each track, you'll get their mood, style, tempo, genre, year of release, and themes. You will need to generate a playlist with twenty tracks based on the name and description and the tracks provided. Your output should be a JSON array of track IDs.

# Steps:
1. Analyze the list of tracks provided.
2. Analyze the name and description provided by the user.
3. Look for tracks that can be a good fit for the playlist. Make sure to add variety to the playlist (example: different genres, different artists, different tempos, different years, etc.), unless the user specifies different requirements (example: "I want all tracks to be from the 80s").
4. Select twenty tracks for the playlist. All playlists must have twenty tracks.
5. Order the tracks in a way that is pleasing to the ear. Make sure the mood and the thempo of the playlist flows well.
6. Return a JSON array with the twenty track IDs of the tracks you chose. Do not return any other text.`
      ),
      new HumanMessage(userPrompt),
    ];
  }
  private generatePromptContext(tracks: AugmentedLibraryTrack[]) {
    return tracks
      .map((track) =>
        `## Track ID: ${track.platformTrackId}
${track.mood ? `Mood: ${track.mood}` : ""}
${track.style ? `Style: ${track.style}` : ""}
${track.tempo ? `Tempo: ${track.tempo} (${track.bpm} BPM)` : ""}
${track.genre ? `Genre: ${track.genre}` : ""}
${track.year ? `Year: ${track.year}` : ""}
${track.themes ? `Themes: ${track.themes}` : ""}`.replace(/\n+/g, "\n")
      )
      .join("\n");
  }
}
