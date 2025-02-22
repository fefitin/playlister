import { LibraryTrack } from "@/types/LibraryTrack";
import { LibraryManagerAdaptor } from "@/adaptors/library-manager/LibraryManagerAdaptor.interface";
import { LibraryStorageAdaptor } from "@/adaptors/library-storage/LibraryStorageAdaptor.interface";
import { TrackAugmenterAdaptor } from "@/adaptors/track-augmenter/TrackAugmenterAdaptor.interface";

export class LibraryProcessor {
  constructor(
    private readonly libraryManager: LibraryManagerAdaptor,
    private readonly storage: LibraryStorageAdaptor,
    private readonly trackAugmenter: TrackAugmenterAdaptor
  ) {}

  /**
   * Processes tracks from the library manager in parallel batches
   * @param parallelLimit - Maximum number of tracks to process in parallel
   * @returns Promise that resolves when all tracks are processed
   */
  async process(parallelLimit = 50) {
    const tracks = await this.libraryManager.getTracks();

    for (let i = 0; i < tracks.length; i += parallelLimit) {
      const promises: Promise<void>[] = [];
      for (let j = 0; j < parallelLimit; j++) {
        const index = i + j;
        const track = tracks[index];
        if (track) {
          promises.push(this.processTrack(track, index + 1, tracks.length));
        }
      }
      await Promise.allSettled(promises);
    }
  }

  /**
   * Processes a single track by checking if it exists, augmenting it with additional data, and storing it
   * @param track - The track to process
   * @param index - Current track number being processed
   * @param total - Total number of tracks to process
   * @returns Promise that resolves when the track is processed
   */
  async processTrack(track: LibraryTrack, index: number, total: number) {
    const exists = await this.storage.trackExists(track.platformTrackId);
    if (exists) {
      console.log(
        `${index}/${total} Skipping ${track.title} by ${track.artist}: already exists`
      );
      return;
    }

    console.log(
      `${index}/${total} Augmenting ${track.title} by ${track.artist}...`
    );
    try {
      const augmentedTrack = await this.trackAugmenter.augmentTrack(track);
      await this.storage.storeTrack(augmentedTrack);
    } catch (error) {
      console.error(error);
      await this.storage.storeTrack(track);
    }
  }
}
