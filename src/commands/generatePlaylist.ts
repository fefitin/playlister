import { ChatAnthropic } from "@langchain/anthropic";
import { input } from "@inquirer/prompts";
import { LangchainLibraryEmbedder } from "@/adaptors/library-embedder/LangchainLibraryEmbedder";
import { PlaylistGenerator } from "@/modules/playlist-generator/PlaylistGenerator";
import { chroma } from "@/storage/chroma";
import { storage } from "@/storage/postgres";
import { AppleMusicPlaylistManager } from "@/adaptors/playlist-manager/AppleMusicPlaylistManager";

export async function generatePlaylist() {
  const name = await input({
    message: "Enter the name for your playlist",
  });

  const prompt = await input({
    message: "Enter the theme for your playlist",
  });

  await storage.connect();

  performance.mark("start");
  const playlistGenerator = new PlaylistGenerator(
    storage,
    new LangchainLibraryEmbedder(chroma),
    new ChatAnthropic({ model: process.env.ANTHROPIC_MODEL, temperature: 0.5 }),
    new AppleMusicPlaylistManager()
  );

  const tracks = await playlistGenerator.generatePlaylist(name, prompt);

  performance.mark("end");
  const duration =
    performance.measure("generation", "start", "end").duration / 1000;

  console.log(
    `Generated a playlist with ${tracks.length} tracks in ${Math.round(duration)} seconds`
  );

  tracks.map((track) => console.log(`* ${track.title} by ${track.artist}`));
}
