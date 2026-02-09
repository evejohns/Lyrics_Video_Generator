import { create } from 'zustand';
import type { Project } from '@shared/project';
import type { LyricLine } from '@shared/lyrics';
import type { VideoConfig } from '@shared/config';

interface EditorState {
  // Current project
  project: Project | null;
  setProject: (project: Project) => void;

  // Lyrics
  lyrics: LyricLine[];
  setLyrics: (lyrics: LyricLine[]) => void;
  updateLyricLine: (lineNumber: number, updates: Partial<LyricLine>) => void;

  // Video configuration
  config: VideoConfig | null;
  setConfig: (config: VideoConfig) => void;
  updateConfig: (updates: Partial<VideoConfig>) => void;

  // Playback state
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;

  // Selected lyric line
  selectedLineNumber: number | null;
  setSelectedLineNumber: (lineNumber: number | null) => void;

  // Reset
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial state
  project: null,
  lyrics: [],
  config: null,
  currentTime: 0,
  isPlaying: false,
  selectedLineNumber: null,

  // Actions
  setProject: (project) => set({ project }),

  setLyrics: (lyrics) => set({ lyrics }),

  updateLyricLine: (lineNumber, updates) =>
    set((state) => ({
      lyrics: state.lyrics.map((line) =>
        line.lineNumber === lineNumber ? { ...line, ...updates } : line
      ),
    })),

  setConfig: (config) => set({ config }),

  updateConfig: (updates) =>
    set((state) => ({
      config: state.config ? { ...state.config, ...updates } : null,
    })),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setSelectedLineNumber: (selectedLineNumber) => set({ selectedLineNumber }),

  reset: () =>
    set({
      project: null,
      lyrics: [],
      config: null,
      currentTime: 0,
      isPlaying: false,
      selectedLineNumber: null,
    }),
}));
