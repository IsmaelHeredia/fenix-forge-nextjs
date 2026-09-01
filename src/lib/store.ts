import { create } from "zustand";
import type { MusicTrack, VideoTrackConfig, VideoGlobalConfig } from "@/types/track";

type StudioState = {
  tracks: MusicTrack[];
  videoConfigs: Record<string, VideoTrackConfig>;
  videoGlobal: VideoGlobalConfig;

  addTracks: (files: File[]) => void;
  updateTrack: (id: string, patch: Partial<MusicTrack>) => void;
  removeTrack: (id: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  setDisplayName: (id: string, name: string) => void;

  setVideoConfig: (trackId: string, patch: Partial<VideoTrackConfig>) => void;
  setVideoGlobal: (patch: Partial<VideoGlobalConfig>) => void;

  totalDurationSec: () => number;
  cumulativeStart: (trackId: string) => number;
};

export const useStudioStore = create<StudioState>((set, get) => ({
  tracks: [],
  videoConfigs: {},
  videoGlobal: { mode: "per-track-image", singleImageFile: null, singleImagePreviewUrl: null, disableAllText: false },

  addTracks: (files) =>
    set((state) => {
      const startOrder = state.tracks.length;
      const newTracks: MusicTrack[] = files.map((file, i) => ({
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        displayName: file.name.replace(/\.mp3$/i, ""),
        durationSec: 0,
        order: startOrder + i,
        uploadProgress: 0,
        status: "pending",
      }));
      return { tracks: [...state.tracks, ...newTracks] };
    }),

  updateTrack: (id, patch) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  removeTrack: (id) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i })),
    })),

  reorderTracks: (fromIndex, toIndex) =>
    set((state) => {
      const next = [...state.tracks];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { tracks: next.map((t, i) => ({ ...t, order: i })) };
    }),

  setDisplayName: (id, name) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, displayName: name } : t)),
    })),

  setVideoConfig: (trackId, patch) =>
    set((state) => {
      const existing = state.videoConfigs[trackId] ?? {
        trackId,
        imageFile: null,
        imagePreviewUrl: null,
        showText: true,
        textColor: "#ffffff",
        textStrokeColor: "#000000",
      };
      return { videoConfigs: { ...state.videoConfigs, [trackId]: { ...existing, ...patch } } };
    }),

  setVideoGlobal: (patch) =>
    set((state) => ({ videoGlobal: { ...state.videoGlobal, ...patch } })),

  totalDurationSec: () => get().tracks.reduce((acc, t) => acc + t.durationSec, 0),

  cumulativeStart: (trackId) => {
    const { tracks } = get();
    const sorted = [...tracks].sort((a, b) => a.order - b.order);
    let acc = 0;
    for (const t of sorted) {
      if (t.id === trackId) return acc;
      acc += t.durationSec;
    }
    return acc;
  },
}));