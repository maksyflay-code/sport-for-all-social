import { useRsvp, type RsvpStatus } from "@/hooks/useRsvp";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, X } from "lucide-react";

interface Props {
  eventId: string;
  compact?: boolean;
}

const RsvpButtons = ({ eventId, compact = false }: Props) => {
  const { myStatus, counts, setRsvp, removeRsvp } = useRsvp(eventId);

  const handle = (s: RsvpStatus) => {
    if (myStatus === s) removeRsvp();
    else setRsvp(s);
  };

  const btn = (status: RsvpStatus, label: string, Icon: any, count: number) => {
    const active = myStatus === status;
    return (
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        onClick={(e) => { e.stopPropagation(); handle(status); }}
        className={`rounded-xl gap-1.5 ${
          active
            ? "bg-orange-500 hover:bg-orange-600 text-white"
            : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{label}</span>
        {count > 0 && <span className="text-xs opacity-70">({count})</span>}
      </Button>
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {btn("going", "Vou", Check, counts.going)}
      {btn("maybe", "Talvez", HelpCircle, counts.maybe)}
      {btn("not_going", "Não vou", X, counts.not_going)}
    </div>
  );
};

export default RsvpButtons;
