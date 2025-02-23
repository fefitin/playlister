import { LibraryEmbedderAdaptor } from "@/adaptors/library-embedder/LibraryEmbedderAdaptor.interface";
import { LibraryStorageAdaptor } from "@/adaptors/library-storage/LibraryStorageAdaptor.interface";

export class LibraryEmbedder {
  constructor(
    private readonly storage: LibraryStorageAdaptor,
    private readonly embedder: LibraryEmbedderAdaptor
  ) {}

  async embedLibrary() {
    const tracks = await this.storage.getTracks();
    const total = tracks.length;

    for (let index = 0; index < total; index++) {
      const track = tracks[index];
      console.log(
        `${index}/${total} Embedding ${track.title} by ${track.artist}...`
      );

      try {
        await this.embedder.embedTrack(track);
      } catch (error) {
        console.error((error as Error).message);
      }
    }
  }
}
