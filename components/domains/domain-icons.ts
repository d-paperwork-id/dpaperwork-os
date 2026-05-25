import {
  Database,
  Users,
  Briefcase,
  ShoppingBag,
  FileText,
  Tag,
  BarChart2,
  Layers,
  Globe,
  Package,
  Target,
  Inbox,
  type LucideIcon,
} from "lucide-react";

export const DOMAIN_ICONS: Record<string, LucideIcon> = {
  database: Database,
  users: Users,
  briefcase: Briefcase,
  "shopping-bag": ShoppingBag,
  "file-text": FileText,
  tag: Tag,
  "bar-chart": BarChart2,
  layers: Layers,
  globe: Globe,
  package: Package,
  target: Target,
  inbox: Inbox,
};

export const DOMAIN_ICON_NAMES = Object.keys(DOMAIN_ICONS);

export function getDomainIcon(name: string | null | undefined): LucideIcon {
  return (name && DOMAIN_ICONS[name]) || Database;
}
