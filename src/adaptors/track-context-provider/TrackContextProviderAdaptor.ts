import { LibraryTrack } from "@/types/LibraryTrack";

export interface TrackContextProviderAdaptor {
  getContext(track: LibraryTrack): Promise<Record<string, string>>;
}
