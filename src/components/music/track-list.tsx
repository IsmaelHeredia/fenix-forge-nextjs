"use client";
import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useStudioStore } from "@/lib/store";
import { TrackItem } from "./track-item";
import type { MusicTrack } from "@/types/track";

export function TrackList() {
  const tracks = useStudioStore((s) => s.tracks);
  const reorderTracks = useStudioStore((s) => s.reorderTracks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPlayingTrackId(null);
  }

  function handleTogglePlay(track: MusicTrack) {
    if (playingTrackId === track.id) {
      stopAudio();
      return;
    }

    stopAudio();

    const url = URL.createObjectURL(track.file);
    objectUrlRef.current = url;

    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.play().catch(() => stopAudio());
    audioRef.current.onended = () => stopAudio();

    setPlayingTrackId(track.id);
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const sorted = [...tracks].sort((a, b) => a.order - b.order);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = sorted.findIndex((t) => t.id === active.id);
    const toIndex = sorted.findIndex((t) => t.id === over.id);
    reorderTracks(fromIndex, toIndex);
  }

  if (sorted.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gruvbox-gray">
        Todavía no agregaste canciones.
      </p>
    );
  }

  let acc = 0;
  const withStart = sorted.map((t) => {
    const startSec = acc;
    acc += t.durationSec;
    return { track: t, startSec };
  });

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {withStart.map(({ track, startSec }) => (
            <TrackItem
              key={track.id}
              track={track}
              startSec={startSec}
              isPlaying={playingTrackId === track.id}
              onTogglePlay={() => handleTogglePlay(track)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}