import { create } from "zustand";

export type JobStatus = "idle" | "uploading" | "processing" | "done" | "error";

export type JobState = {
  status: JobStatus;
  uploadProgress: number;
  elapsedSec: number | null;
  resultUrl: string | null;
  startTime: number;
};

const initialJob: JobState = {
  status: "idle",
  uploadProgress: 0,
  elapsedSec: null,
  resultUrl: null,
  startTime: 0,
};

export type JobKind = "music" | "video";

type JobsStore = {
  jobs: Record<JobKind, JobState>;
  startJob: (kind: JobKind) => void;
  setProgress: (kind: JobKind, percent: number) => void;
  setProcessing: (kind: JobKind) => void;
  finishJob: (kind: JobKind, resultUrl: string, elapsedSec: number) => void;
  failJob: (kind: JobKind) => void;
  resetJob: (kind: JobKind) => void;
};

export const useJobStore = create<JobsStore>((set) => ({
  jobs: { music: initialJob, video: initialJob },

  startJob: (kind) =>
    set((state) => ({
      jobs: { ...state.jobs, [kind]: { ...initialJob, status: "uploading", startTime: Date.now() } },
    })),

  setProgress: (kind, percent) =>
    set((state) => ({
      jobs: { ...state.jobs, [kind]: { ...state.jobs[kind], uploadProgress: percent } },
    })),

  setProcessing: (kind) =>
    set((state) => ({
      jobs: { ...state.jobs, [kind]: { ...state.jobs[kind], status: "processing" } },
    })),

  finishJob: (kind, resultUrl, elapsedSec) =>
    set((state) => ({
      jobs: { ...state.jobs, [kind]: { ...state.jobs[kind], status: "done", resultUrl, elapsedSec } },
    })),

  failJob: (kind) =>
    set((state) => ({
      jobs: { ...state.jobs, [kind]: { ...state.jobs[kind], status: "error" } },
    })),

  resetJob: (kind) =>
    set((state) => ({
      jobs: { ...state.jobs, [kind]: initialJob },
    })),
}));