export interface PlaylistManagerAdaptor {
  createPlaylist(name: string, trackIds: string[]): Promise<void>;
}
