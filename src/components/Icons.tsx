import {
  ArrowDown,
  AlertCircle,
  Bell,
  ChevronDown,
  CircleHelp,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  Gift,
  FileText,
  Headphones,
  Heart,
  House,
  BookOpen,
  Workflow,
  LogIn,
  UserPlus,
  Info,
  LayoutDashboard,
  Mail,
  Plus,
  RefreshCw,
  Search,
  LogOut,
  MapPin,
  Menu,
  Package,
  PackageCheck,
  Recycle,
  ShieldCheck,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import type { IconType } from "react-icons";

type BrandIconName = "instagram" | "tiktok" | "whatsapp";

export type IconName =
  | "arrow-down"
  | "alert-circle"
  | "bell"
  | "arrow-up-right"
  | "arrow-left"
  | "check"
  | "chevron-down"
  | "check-circle"
  | "circle-help"
  | "clock"
  | "calendar-clock"
  | "dashboard"
  | "gift"
  | "file-text"
  | "headphones"
  | "house"
  | "book-open"
  | "workflow"
  | "log-in"
  | "user-plus"
  | "heart"
  | "info"
  | "mail"
  | "plus"
  | "refresh-cw"
  | "search"
  | "instagram"
  | "log-out"
  | "map-pin"
  | "menu"
  | "package"
  | "package-check"
  | "recycle"
  | "shield-check"
  | "settings"
  | "shopping-bag"
  | "sparkles"
  | "tiktok"
  | "users"
  | "whatsapp"
  | "x"
  | "x-circle";

type LucideName = Exclude<IconName, BrandIconName>;

const lucideIconMap: Record<LucideName, LucideIcon> = {
  "arrow-down": ArrowDown,
  "alert-circle": AlertCircle,
  bell: Bell,
  "arrow-up-right": ArrowUpRight,
  "arrow-left": ArrowLeft,
  check: Check,
  "chevron-down": ChevronDown,
  "check-circle": CircleCheck,
  "circle-help": CircleHelp,
  clock: Clock,
  "calendar-clock": CalendarClock,
  dashboard: LayoutDashboard,
  gift: Gift,
  "file-text": FileText,
  headphones: Headphones,
  house: House,
  "book-open": BookOpen,
  workflow: Workflow,
  "log-in": LogIn,
  "user-plus": UserPlus,
  heart: Heart,
  info: Info,
  mail: Mail,
  plus: Plus,
  "refresh-cw": RefreshCw,
  search: Search,
  "log-out": LogOut,
  "map-pin": MapPin,
  menu: Menu,
  package: Package,
  "package-check": PackageCheck,
  recycle: Recycle,
  "shield-check": ShieldCheck,
  settings: Settings,
  "shopping-bag": ShoppingBag,
  sparkles: Sparkles,
  users: Users,
  x: X,
  "x-circle": CircleX,
};

const brandIconMap: Record<BrandIconName, IconType> = {
  instagram: FaInstagram,
  tiktok: FaTiktok,
  whatsapp: FaWhatsapp,
};

export function Icon({
  name,
  className = "icon-inline",
  size,
}: {
  name: IconName;
  className?: string;
  size?: number;
}) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  if (name === "instagram" || name === "tiktok" || name === "whatsapp") {
    const BrandIcon = brandIconMap[name];
    return (
      <BrandIcon
        className={`${className} icon-brand`}
        size={size ?? 20}
        style={style}
        aria-hidden="true"
        focusable="false"
      />
    );
  }

  const LucideIconComponent = lucideIconMap[name as LucideName];
  return (
    <LucideIconComponent
      className={`${className} icon-lucide`}
      size={size ?? 20}
      strokeWidth={1.9}
      style={style}
      aria-hidden="true"
      focusable="false"
    />
  );
}
