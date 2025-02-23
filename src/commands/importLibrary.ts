import { ChatOllama } from "@langchain/ollama";
import { LangchainLibraryEmbedder } from "@/adaptors/library-embedder/LangchainLibraryEmbedder";
import { AppleMusicLibraryAdaptor } from "@/adaptors/library-manager/AppleMusicLibraryAdaptor";
import { AITrackAugmenter } from "@/adaptors/track-augmenter/AITrackAugmenter";
import { GeniusContextProvider } from "@/adaptors/track-context-provider/GeniusContextProvider";
import { LibraryProcessor } from "@/modules/library-processor/LibraryProcessor";
import { input } from "@inquirer/prompts";
import { storage } from "@/storage/postgres";
import { chroma } from "@/storage/chroma";

export async function importLibrary() {
  const library = await input({
    message: "Enter the path to your library file",
  });

  await storage.connect();

  const processor = new LibraryProcessor(
    new AppleMusicLibraryAdaptor(library),
    storage,
    new AITrackAugmenter(
      new ChatOllama({ model: "llama3.1:latest" }),
      new GeniusContextProvider(String(process.env.GENIUS_API_KEY))
    ),
    new LangchainLibraryEmbedder(chroma)
  );

  await processor.process();
}
