import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Playlist } from "@/types/music";
interface Preferences {
  collapsed: boolean;
  reducedMotion: boolean;
  defaultAlgorithm: "Greedy" | "Dynamic Programming" | "Branch and Bound";
}
interface MusicState {
  playlists: Playlist[];
  recent: Playlist[];
  active: Playlist | null;
  ready: boolean;
  search: string;
  setSearch: (s: string) => void;
  preferences: Preferences;
  setPreferences: (p: Preferences) => void;
  save: (p: Playlist) => void;
  remove: (id: string) => void;
  activate: (p: Playlist) => void;
  update: (p: Playlist) => void;
}
const MusicContext = createContext<MusicState | null>(null);
const defaults: Preferences = {
  collapsed: false,
  reducedMotion: false,
  defaultAlgorithm: "Greedy",
};
const algorithms = new Set<Preferences["defaultAlgorithm"]>([
  "Greedy",
  "Dynamic Programming",
  "Branch and Bound",
]);
const moods = new Set(["Focus", "Chill", "Euphoric", "Melancholic", "Dreamy", "Late Night"]);
function isPlaylist(value: unknown): value is Playlist {
  if (!value || typeof value !== "object") return false;
  const playlist = value as Partial<Playlist>;
  return (
    typeof playlist.id === "string" &&
    typeof playlist.title === "string" &&
    typeof playlist.createdAt === "string" &&
    Array.isArray(playlist.tracks) &&
    playlist.tracks.every(
      (track) =>
        track &&
        typeof track.id === "string" &&
        typeof track.title === "string" &&
        typeof track.artist === "string" &&
        typeof track.genre === "string" &&
        typeof track.duration === "number" &&
        Number.isFinite(track.duration) &&
        track.duration > 0 &&
        typeof track.tempo === "number" &&
        Number.isFinite(track.tempo) &&
        typeof track.energy === "number" &&
        Number.isFinite(track.energy) &&
        typeof track.valence === "number" &&
        Number.isFinite(track.valence),
    ) &&
    Array.isArray(playlist.pinned) &&
    playlist.pinned.every((id) => typeof id === "string") &&
    !!playlist.settings &&
    moods.has(playlist.settings.mood) &&
    algorithms.has(playlist.settings.algorithm) &&
    Array.isArray(playlist.settings.genres) &&
    typeof playlist.settings.duration === "number"
  );
}
function uniquePlaylists(value: unknown): Playlist[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.filter((playlist): playlist is Playlist => {
    if (!isPlaylist(playlist) || ids.has(playlist.id)) return false;
    ids.add(playlist.id);
    return true;
  });
}
function restoredPreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object") return defaults;
  const candidate = value as Partial<Preferences>;
  return {
    collapsed: Boolean(candidate.collapsed),
    reducedMotion: Boolean(candidate.reducedMotion),
    defaultAlgorithm: algorithms.has(candidate.defaultAlgorithm ?? "Greedy")
      ? candidate.defaultAlgorithm!
      : defaults.defaultAlgorithm,
  };
}
export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]),
    [recent, setRecent] = useState<Playlist[]>([]),
    [active, setActive] = useState<Playlist | null>(null),
    [preferences, setPreferences] = useState(defaults),
    [ready, setReady] = useState(false),
    [search, setSearch] = useState("");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("moodmix.v1") ?? "null");
      if (saved) {
        const restored = uniquePlaylists(saved.playlists);
        setPlaylists(restored);
        setRecent(uniquePlaylists(saved.recent));
        setActive(isPlaylist(saved.active) ? saved.active : null);
        setPreferences(restoredPreferences(saved.preferences));
      }
    } catch {
      /* Corrupt storage resets safely. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(
          "moodmix.v1",
          JSON.stringify({ playlists, recent, active, preferences }),
        );
      } catch {
        /* Keep this session usable if storage is full. */
      }
      document.documentElement.classList.toggle("reduce-motion", preferences.reducedMotion);
    }
  }, [playlists, recent, active, preferences, ready]);
  const update = (p: Playlist) => {
    setActive(p);
    setPlaylists((old) => old.map((x) => (x.id === p.id ? p : x)));
    setRecent((old) => old.map((x) => (x.id === p.id ? p : x)));
  };
  return (
    <MusicContext.Provider
      value={{
        playlists,
        recent,
        active,
        ready,
        search,
        setSearch,
        preferences,
        setPreferences,
        save: (p) => setPlaylists((old) => [p, ...old.filter((x) => x.id !== p.id)]),
        remove: (id) => {
          setPlaylists((old) => old.filter((x) => x.id !== id));
          setRecent((old) => old.filter((x) => x.id !== id));
          setActive((old) => (old?.id === id ? null : old));
        },
        activate: (p) => {
          setActive(p);
          setRecent((old) => [p, ...old.filter((x) => x.id !== p.id)].slice(0, 8));
        },
        update,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}
export function useMusic() {
  const value = useContext(MusicContext);
  if (!value) throw new Error("MusicProvider missing");
  return value;
}
