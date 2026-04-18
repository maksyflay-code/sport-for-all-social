import { useState } from "react";
import { useStories } from "@/hooks/useStories";
import StoryUploader from "./StoryUploader";
import StoryViewer from "./StoryViewer";
import { useAuth } from "@/contexts/AuthContext";

const StoriesBar = () => {
  const { user } = useAuth();
  const { groups, loading, reload } = useStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  if (loading) return null;

  // Put own group first
  const ordered = user
    ? [
        ...groups.filter((g) => g.user_id === user.id),
        ...groups.filter((g) => g.user_id !== user.id),
      ]
    : groups;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/5 p-4">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        <StoryUploader onCreated={reload} />
        {ordered.map((g, idx) => (
          <button
            key={g.user_id}
            onClick={() => { setActiveIdx(idx); setViewerOpen(true); }}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-orange-400 via-orange-500 to-pink-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#16162a] border-2 border-[#1a1a2e] flex items-center justify-center">
                {g.avatar_url ? (
                  <img src={g.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white">{g.display_name?.charAt(0)?.toUpperCase() || "?"}</span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-white/70 group-hover:text-white truncate max-w-[64px]">
              {g.user_id === user?.id ? "Você" : g.display_name?.split(" ")[0] || "—"}
            </span>
          </button>
        ))}
        {ordered.length === 0 && (
          <p className="text-xs text-white/30 self-center pl-2">Seja o primeiro a publicar um story 🎬</p>
        )}
      </div>

      {viewerOpen && (
        <StoryViewer
          groups={ordered}
          initialUserIndex={activeIdx}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          onDeleted={reload}
        />
      )}
    </div>
  );
};

export default StoriesBar;
