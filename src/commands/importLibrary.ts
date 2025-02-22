import { AppleMusicLibraryAdaptor } from "@/adaptors/library-manager/AppleMusicLibraryAdaptor";
import { LibraryPostgresStorage } from "@/adaptors/library-storage/LibraryPostgresStorage";
import { AITrackAugmenter } from "@/adaptors/track-augmenter/AITrackAugmenter";
import { GeniusContextProvider } from "@/adaptors/track-context-provider/GeniusContextProvider";
import { LibraryProcessor } from "@/modules/library-processor/LibraryProcessor";
import { input } from "@inquirer/prompts";
import { ChatOllama } from "@langchain/ollama";

export async function importLibrary() {
  /*const library = await input({
    message: "Enter the path to your library file",
  });*/
  const library = "/Users/federico/Desktop/Projects/playlister/Library.xml";

  const storage = new LibraryPostgresStorage({
    host: String(process.env.DB_HOST),
    port: Number(process.env.DB_PORT),
    user: String(process.env.DB_USER),
    password: String(process.env.DB_PASSWORD),
    database: String(process.env.DB_NAME),
  });
  await storage.connect();

  const processor = new LibraryProcessor(
    new AppleMusicLibraryAdaptor(library),
    storage,
    new AITrackAugmenter(
      new ChatOllama({ model: "llama3.1:latest" }),
      new GeniusContextProvider(String(process.env.GENIUS_API_KEY))
    )
  );

  await processor.process();
}
