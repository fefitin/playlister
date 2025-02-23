import { LangchainLibraryEmbedder } from "@/adaptors/library-embedder/LangchainLibraryEmbedder";
import { LibraryEmbedder } from "@/modules/library-embedder/LibraryEmbedder";
import { chroma } from "@/storage/chroma";
import { storage } from "@/storage/postgres";

export async function embedLibrary() {
  await storage.connect();

  const libraryEmbedder = new LibraryEmbedder(
    storage,
    new LangchainLibraryEmbedder(chroma)
  );
  await libraryEmbedder.embedLibrary();
}
