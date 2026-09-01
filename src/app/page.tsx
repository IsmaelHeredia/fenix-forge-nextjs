"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { TabsNav } from "@/components/tabs-nav";
import { MusicTab } from "@/components/music/music-tab";
import { VideoTab } from "@/components/video/video-tab";

export default function Home() {
  const [tab, setTab] = useState<"music" | "video">("music");

  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <main className="w-full px-4 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-7xl">
          <TabsNav active={tab} onChange={setTab} />
          <div className="mt-6">
            {tab === "music" ? <MusicTab /> : <VideoTab />}
          </div>
        </div>
      </main>
    </div>
  );
}