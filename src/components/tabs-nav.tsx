"use client";

type Tab = "music" | "video";

export function TabsNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "music", label: "Música" },
    { id: "video", label: "Video" },
  ];

  return (
    <div className="flex gap-1 border-b border-gruvbox-gray/30">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-base font-semibold transition-colors ${active === tab.id
              ? "border-b-2 border-gruvbox-green text-gruvbox-text"
              : "text-gruvbox-gray hover:text-gruvbox-text"
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}