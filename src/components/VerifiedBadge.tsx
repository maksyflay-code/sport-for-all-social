import { BadgeCheck } from "lucide-react";

interface Props {
  verified: boolean | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Selo azulzinho de verificado, exibido ao lado do display_name.
 * Renderiza nada se verified !== true.
 */
const VerifiedBadge = ({ verified, size = "sm", className = "" }: Props) => {
  if (!verified) return null;
  const sizeMap = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" };
  return (
    <BadgeCheck
      aria-label="Conta verificada"
      title="Conta verificada"
      className={`inline-block text-[#1d9bf0] fill-[#1d9bf0]/15 shrink-0 ${sizeMap[size]} ${className}`}
    />
  );
};

export default VerifiedBadge;
