import { LibraryTrack } from "@/types/LibraryTrack";

export interface LibraryManagerAdaptor {
  getTracks(): Promise<LibraryTrack[]>;
}
