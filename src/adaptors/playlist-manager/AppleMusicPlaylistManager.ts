import { runAppleScript } from "run-applescript";
import { PlaylistManagerAdaptor } from "./PlaylistManagerAdaptor.interface";

export class AppleMusicPlaylistManager implements PlaylistManagerAdaptor {
  async createPlaylist(name: string, trackIds: string[]) {
    try {
      await runAppleScript(`
-- Define the playlist name and track IDs
set playlistName to "${name}"
set trackIDs to {${trackIds.map((id) => `"${id}"`).join(", ")}} -- Replace with your actual persistent track IDs

-- Get the Music application
tell application "Music"
    -- Create a new playlist
    set newPlaylist to make new user playlist with properties {name:playlistName}
    
    -- Add tracks to the playlist
    repeat with trackID in trackIDs
      try
          set theTrack to (first track of library playlist 1 whose persistent ID is trackID)
          duplicate theTrack to newPlaylist
      on error
          display notification "Track with ID " & trackID & " not found in library" with title "Track Missing"
      end try
    end repeat
end tell`);
    } catch (error) {
      throw new Error(
        `Failed to create Apple Music playlist: ${(error as Error).message}`
      );
    }
  }
}
