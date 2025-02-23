import { AugmentedLibraryTrack } from "@/types/LibraryTrack";

export interface LibraryStorageAdaptor {
  trackExists(platformTrackId: string): Promise<boolean>;
  storeTrack(track: AugmentedLibraryTrack): Promise<void>;
  getTracks(): Promise<AugmentedLibraryTrack[]>;
  getTrackByPlatformId(platformTrackId: string): Promise<AugmentedLibraryTrack>;
}
