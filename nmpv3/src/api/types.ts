export interface NeteaseSongResponse {
  id: string;
  name: string;
  artists?: string;
  album?: string;
  picUrl?: string;
  url?: string;
}

export interface NeteasePlaylistResponse {
  id: string;
  name?: string;
  songs: NeteaseSongResponse[];
}

export interface NeteaseLyricResponse {
  nolyric?: boolean;
  pureMusic?: boolean;
  uncollected?: boolean;
  lrc?: {
    lyric?: string;
  };
  tlyric?: {
    lyric?: string;
  };
}
