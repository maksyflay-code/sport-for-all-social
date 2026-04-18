import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { StoryGroup } from "@/hooks/useStories";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  groups: StoryGroup[];
  initialUserIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

const STORY_DURATION_MS = 5000;

const StoryViewer = ({ groups, initialUserIndex, open, onOpenChange, onDeleted }: Props) => {
  const { user } = useAuth();
  const [userIdx, setUserIdx] = useState(initialUserIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => { if (open) { setUserIdx(initialUserIndex); setStoryIdx(0); setProgress(0); } }, [open, initialUserIndex]);

  const currentGroup = groups[userIdx];
  const currentStory = currentGroup?.stories[storyIdx];
  const isImage = currentStory?.media_type === "image";

  // Mark as viewed
  useEffect(() => {
    if (!open || !user || !currentStory) return;
    if (currentStory.user_id === user.id) return;
    (supabase.from("story_views" as any) as any).insert({
      story_id: currentStory.id,
      viewer_id: user.id,
    }).then(() => {});
  }, [currentStory?.id, user?.id, open]);

  // Auto-advance for images
  useEffect(() => {
    if (!open || !currentStory || !isImage || paused) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    setProgress(0);
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) { next(); }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?.id, paused, open, isImage]);

  const next = () => {
    if (!currentGroup) return;
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx(storyIdx + 1);
    } else if (userIdx < groups.length - 1) {
      setUserIdx(userIdx + 1);
      setStoryIdx(0);
    } else {
      onOpenChange(false);
    }
    setProgress(0);
  };

  const prev = () => {
    if (storyIdx > 0) setStoryIdx(storyIdx - 1);
    else if (userIdx > 0) {
      const prevGroup = groups[userIdx - 1];
      setUserIdx(userIdx - 1);
      setStoryIdx(prevGroup.stories.length - 1);
    }
    setProgress(0);
  };

  const handleDelete = async () => {
    if (!currentStory) return;
    if (!window.confirm("Excluir este story?")) return;
    const { error } = await supabase.from("stories" as any).delete().eq("id", currentStory.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Story excluído");
    onDeleted?.();
    onOpenChange(false);
  };

  if (!currentStory || !currentGroup) return null;

  const isOwn = user?.id === currentStory.user_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-none max-w-md p-0 overflow-hidden h-[90vh] flex flex-col">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1">
          {currentGroup.stories.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{ width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4 pt-3 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/30 overflow-hidden flex items-center justify-center shrink-0">
            {currentGroup.avatar_url ? (
              <img src={currentGroup.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">{currentGroup.display_name?.charAt(0)?.toUpperCase() || "?"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentGroup.display_name || "Anônimo"}</p>
            <p className="text-[10px] text-white/60">
              {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
          {isOwn && (
            <Button size="icon" variant="ghost" onClick={handleDelete} className="text-white hover:bg-white/10 rounded-full">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Media */}
        <div
          className="relative flex-1 flex items-center justify-center bg-black select-none"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {isImage ? (
            <img src={currentStory.media_url} alt="" className="max-w-full max-h-full object-contain" />
          ) : (
            <video
              key={currentStory.id}
              src={currentStory.media_url}
              className="max-w-full max-h-full"
              autoPlay
              playsInline
              controls={false}
              onEnded={next}
            />
          )}

          {/* Tap zones */}
          <button onClick={prev} className="absolute left-0 top-0 bottom-0 w-1/3" aria-label="Anterior" />
          <button onClick={next} className="absolute right-0 top-0 bottom-0 w-1/3" aria-label="Próximo" />

          {/* Visible chevrons (desktop) */}
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 hidden sm:flex w-9 h-9 rounded-full bg-black/40 items-center justify-center text-white hover:bg-black/60">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex w-9 h-9 rounded-full bg-black/40 items-center justify-center text-white hover:bg-black/60">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
            <p className="text-white text-sm">{currentStory.caption}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoryViewer;
