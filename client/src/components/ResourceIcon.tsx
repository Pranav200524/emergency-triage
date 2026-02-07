import { ResourceType } from "@shared/schema";
import { Ambulance, Home, Utensils, Shield, Flame, MapPin } from "lucide-react";

interface ResourceIconProps {
  type: ResourceType;
  className?: string;
}

export function ResourceIcon({ type, className }: ResourceIconProps) {
  const icons: Record<ResourceType, React.ElementType> = {
    Ambulance: Ambulance,
    Shelter: Home,
    Food: Utensils,
    Police: Shield,
    Fire: Flame,
    General: MapPin,
  };

  const Icon = icons[type] || MapPin;

  return <Icon className={className} />;
}
