import { useState } from "react";
import { useStories } from "@/hooks/useStories";
import StoryUploader from "./StoryUploader";
import StoryViewer from "./StoryViewer";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";

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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {/* Card "Criar story" estilo FB */}
      <div className="relative shrink-0 w-[112px] h-[200px] rounded-xl overflow-hidden bg-white shadow-sm border border-white/5">
        <div className="h-[140px] bg-gradient-to-b from-slate-300 to-slate-100 flex items-center justify-center">
          {user && (
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center border-4 border-white">
              <span className="text-base font-bold text-orange-400">+</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-white flex items-center justify-center">
          <StoryUploader onCreated={reload} />
        </div>
        <div className="absolute top-[120px] left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-orange-500 border-4 border-white flex items-center justify-center pointer-events-none">
          <Plus className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Story cards estilo FB */}
      {ordered.map((g, idx) => (
        <button
          key={g.user_id}
          onClick={() => { setActiveIdx(idx); setViewerOpen(true); }}
          className="relative shrink-0 w-[112px] h-[200px] rounded-xl overflow-hidden group"
        >
          {g.avatar_url ? (
            <img src={g.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {g.display_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          {/* Avatar circular no canto sup esquerdo */}
          <div className="absolute top-2 left-2 w-9 h-9 rounded-full p-[2px] bg-orange-500">
            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
              {g.avatar_url ? (
                <img src={g.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-orange-500">{g.display_name?.charAt(0)?.toUpperCase() || "?"}</span>
              )}
            </div>
          </div>
          {/* Overlay com nome */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="text-[11px] font-semibold text-white truncate text-left">
              {g.user_id === user?.id ? "Você" : g.display_name?.split(" ")[0] || "—"}
            </p>
          </div>
        </button>
      ))}

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
