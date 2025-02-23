import { VectorStore } from "@langchain/core/vectorstores";
import { AugmentedLibraryTrack } from "@/types/LibraryTrack";
import { BaseLibraryEmbedder } from "./BaseLibraryEmbedder.abstract";
import { Document } from "@langchain/core/documents";

export class LangchainLibraryEmbedder extends BaseLibraryEmbedder {
  constructor(private readonly vectorStore: VectorStore) {
    super();
  }

  async embedTrack(track: AugmentedLibraryTrack): Promise<void> {
    const content = this.generateContent(track);

    try {
      await this.vectorStore.addDocuments(
        [new Document({ pageContent: content, metadata: track })],
        { ids: [track.platformTrackId] }
      );
    } catch (e) {
      throw new Error(`Failed to embed track: ${(e as Error).message}`);
    }
  }
}
