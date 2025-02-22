import { AugmentedLibraryTrack, LibraryTrack } from "@/types/LibraryTrack";

export interface TrackAugmenterAdaptor {
  augmentTrack(track: LibraryTrack): Promise<AugmentedLibraryTrack>;
}
