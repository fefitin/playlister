/**
 * This interface represents a track in the user's library.
 */
export interface LibraryTrack {
  platformTrackId: string;
  title: string;
  artist: string;
  album: string;
  genre?: string;
  year?: number;
  totalTime?: number;
  location: string;
}

/**
 * This interface represents a track in the user's library,
 * augmented by the application with additional information.
 */
export interface AugmentedLibraryTrack extends LibraryTrack {
  themes?: string;
  keywords?: string;
  mood?: string;
  bpm?: number;
  tempo?: string;
  style?: string;
}
