import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import type { StoryReaction } from "@/hooks/useStoryReactions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reactions: StoryReaction[];
}

const StoryReactionsList = ({ open, onOpenChange, reactions }: Props) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white text-base">
            Reações ({reactions.length})
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto space-y-2 -mx-2 px-2">
          {reactions.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-6">Ainda sem reações</p>
          ) : (
            reactions.map((r) => (
              <button
                key={r.id}
                onClick={() => { onOpenChange(false); navigate(`/usuario/${r.user_id}`); }}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-orange-400">
                      {r.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-white flex-1 truncate">
                  {r.display_name || "Anônimo"}
                </p>
                <span className="text-2xl">{r.emoji}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryReactionsList;
