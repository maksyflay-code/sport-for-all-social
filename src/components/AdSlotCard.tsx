import { useEffect } from "react";
import { useAdSlots } from "@/hooks/useAdSlots";
import { Megaphone } from "lucide-react";
import { trackAdImpression, trackAdClick } from "@/lib/adTracking";

interface Props {
  position: "sidebar_left" | "sidebar_right";
}

const AdSlotCard = ({ position }: Props) => {
  const { ads, loading } = useAdSlots(position);

  useEffect(() => {
    if (loading) return;
    ads.forEach((ad) => { trackAdImpression(ad.id); });
  }, [ads, loading]);

  if (loading || ads.length === 0) return null;

  return (
    <div className="space-y-3">
      {ads.map((ad) => {
        const content = (
          <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden hover:border-orange-400/30 transition-colors">
            {ad.image_url && (
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-28 object-cover"
                loading="lazy"
              />
            )}
            <div className="p-3">
              <div className="flex items-center gap-1.5 text-[9px] font-semibold text-orange-400/70 uppercase tracking-wider mb-1">
                <Megaphone className="w-2.5 h-2.5" /> Patrocinado
              </div>
              <p className="text-xs font-bold text-white leading-tight">{ad.title}</p>
              {ad.description && (
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{ad.description}</p>
              )}
            </div>
          </div>
        );

        return ad.link_url ? (
          <a
            key={ad.id}
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block"
            onClick={() => { trackAdClick(ad.id); }}
            onAuxClick={(e) => { if (e.button === 1) trackAdClick(ad.id); }}
          >
            {content}
          </a>
        ) : (
          <div key={ad.id}>{content}</div>
        );
      })}
    </div>
  );
};

export default AdSlotCard;
