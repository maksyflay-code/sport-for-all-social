import { useUserBadges } from "@/hooks/useBadges";
import { Trophy } from "lucide-react";

interface Props {
  userId: string | undefined;
  emptyHint?: string;
}

const BadgeGrid = ({ userId, emptyHint = "Ainda sem conquistas. Continue postando!" }: Props) => {
  const { badges, loading } = useUserBadges(userId);

  if (loading) return null;

  if (badges.length === 0) {
    return (
      <p className="text-xs text-white/40 text-center py-3">{emptyHint}</p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {badges.map((b) => (
        <div
          key={b.id}
          title={`${b.title} — ${b.description}`}
          className="bg-orange-500/10 border border-orange-400/20 rounded-2xl p-3 text-center hover:bg-orange-500/20 transition-colors"
        >
          <div className="text-3xl mb-1">{b.emoji}</div>
          <p className="text-xs font-bold text-white truncate">{b.title}</p>
          <p className="text-[10px] text-white/40 mt-0.5">
            {new Date(b.earned_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </p>
        </div>
      ))}
    </div>
  );
};

export default BadgeGrid;
