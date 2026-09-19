import {
  LayoutDashboard,
  Wallet,
  Home,
  ShieldCheck,
  FileText,
  Wrench,
  CalendarDays,
  Receipt,
  Search,
  Sparkles,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kosten", label: "Kosten", icon: Wallet },
  { href: "/haus-anlagen", label: "Haus & Anlagen", icon: Home },
  { href: "/versicherungen", label: "Versicherungen", icon: ShieldCheck },
  { href: "/dokumente", label: "Dokumente", icon: FileText },
  { href: "/wartungen", label: "Wartungen", icon: Wrench },
  { href: "/termine", label: "Termine", icon: CalendarDays },
  { href: "/steuer-datev", label: "Steuer & DATEV", icon: Receipt },
  { href: "/suche", label: "Suche", icon: Search },
  { href: "/assistent", label: "KI-Assistent", icon: Sparkles },
] as const;
