"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookmarkCheck,
  BookOpen,
  BookText,
  Clock3,
  Headphones,
  Heart,
  Home,
  ScrollText,
  Settings,
  ShieldCheck,
  Trophy
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavLink = { href: string; label: string; shortLabel: string; icon: LucideIcon };

const navLinks: NavLink[] = [
  { href: "/", label: "الرئيسية", shortLabel: "الرئيسية", icon: Home },
  { href: "/quran", label: "القرآن", shortLabel: "القرآن", icon: BookOpen },
  { href: "/tafsir", label: "التفسير", shortLabel: "التفسير", icon: BookText },
  { href: "/azkar", label: "الأذكار", shortLabel: "الأذكار", icon: Heart },
  { href: "/hadith", label: "الحديث", shortLabel: "الحديث", icon: ScrollText },
  { href: "/audio", label: "الصوتيات", shortLabel: "الصوتيات", icon: Headphones },
  { href: "/prayer-times", label: "الصلاة", shortLabel: "الصلاة", icon: Clock3 },
  { href: "/khatma", label: "الختمة", shortLabel: "الختمة", icon: Trophy },
  { href: "/notifications", label: "التنبيهات", shortLabel: "تنبيهات", icon: Bell }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function LogoBox({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[1.35rem] border border-[#d7bf86]/65 bg-[#fffaf0] shadow-[0_12px_28px_rgba(0,0,0,.22)] ring-1 ring-white/40 ${
        compact ? "h-14 w-14" : "h-[4.6rem] w-[4.6rem]"
      }`}
    >
      <span className="pointer-events-none absolute inset-1 rounded-[1.05rem] border border-[#ead9b6]" />
      <Image src="/rifq-logo.png" alt="شعار رِفْق" fill priority className="object-cover object-center p-1.5" sizes={compact ? "56px" : "74px"} />
    </span>
  );
}

function BrandCard() {
  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-3 rounded-[1.7rem] border border-[#d8c094]/45 bg-[#fffaf2]/88 px-3 py-2 shadow-[0_14px_34px_rgba(63,86,56,.12)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-[#fff8ec] dark:border-white/10 dark:bg-white/10 dark:ring-white/5 dark:hover:bg-white/15"
    >
      <LogoBox compact />
      <span className="min-w-0 text-right leading-tight">
        <span className="block truncate text-2xl font-black tracking-wide text-[#31452c] dark:text-[#f7edda]">رِفْق</span>
        <span className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[10px] font-black text-[#8d773f] dark:!text-[#f2d38b] sm:text-[11px]">
          <ShieldCheck size={12} className="shrink-0" />
          <span className="truncate">القرآن الكريم نور للقلب</span>
        </span>
      </span>
    </Link>
  );
}

function HeaderActionButton({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: LucideIcon; pathname: string }) {
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition ${
        active
          ? "border-[#3f5638] bg-[#3f5638] text-white shadow-lg shadow-[#3f5638]/20"
          : "border-[#d8c094]/55 bg-white/85 text-[#3f5638] shadow-sm ring-1 ring-white/70 hover:bg-[#fff8ec] dark:border-white/10 dark:bg-white/10 dark:text-[#d8c094] dark:ring-white/5 dark:hover:bg-white/15"
      }`}
    >
      <Icon size={18} />
    </Link>
  );
}

function DesktopNavLink({ link, pathname, index }: { link: NavLink; pathname: string; index: number }) {
  const Icon = link.icon;
  const active = isActive(pathname, link.href);

  return (
    <Link
      href={link.href}
      className={`group relative inline-flex h-12 shrink-0 items-center gap-2 overflow-hidden rounded-2xl px-3.5 text-sm font-black transition-all duration-300 ${
        active ? "bg-[#3f5638] text-white shadow-[0_14px_30px_rgba(63,86,56,.2)]" : "text-[#31452c] hover:bg-[#f2e7d2] dark:!text-[#f7edda] dark:hover:bg-white/10"
      }`}
      style={{ animation: "qawra-soft-rise .42s ease-out both", animationDelay: `${index * 30}ms` }}
    >
      <Icon size={17} className={active ? "text-[#efdcb6]" : "text-[#8d773f] dark:!text-[#f2d38b]"} />
      <span className="whitespace-nowrap">{link.label}</span>
      <span className={`absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-[#d8c094] transition ${active ? "opacity-100" : "opacity-0 group-hover:opacity-70"}`} />
    </Link>
  );
}

function MobileNavLink({ link, pathname }: { link: NavLink; pathname: string }) {
  const Icon = link.icon;
  const active = isActive(pathname, link.href);

  return (
    <Link
      href={link.href}
      className={`group relative flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-black leading-none transition ${
        active ? "bg-[#3f5638] text-white shadow-[0_10px_26px_rgba(63,86,56,.2)]" : "text-[#31452c] hover:bg-[#f2e7d2] dark:!text-[#f7edda] dark:hover:bg-white/10"
      }`}
    >
      <Icon size={16} className={active ? "text-[#efdcb6]" : "text-[#8d773f] dark:!text-[#f2d38b]"} />
      <span className="whitespace-nowrap">{link.shortLabel}</span>
      <span className={`absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-[#d8c094] ${active ? "opacity-100" : "opacity-0"}`} />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const isQuranPage = pathname.startsWith("/quran");

  return (
    <header className={`rifq-app-header ${isQuranPage ? "quran-compact-header" : ""} sticky top-0 z-50 px-3 py-3`}>
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-visible rounded-[2rem] border border-[#d8c094]/45 bg-[#fffaf2]/90 p-3 shadow-[0_20px_55px_rgba(50,68,44,.13)] ring-1 ring-white/70 backdrop-blur-2xl dark:!border-[#2d3f30] dark:!bg-[#0b1711] dark:ring-[#d8c094]/10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
            <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-[#6f7f5b]/14 blur-3xl" />
            <div className="absolute -left-24 -bottom-32 h-72 w-72 rounded-full bg-[#c8a960]/16 blur-3xl" />
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#c8a960]/80 to-transparent" />
          </div>

          <div className="relative hidden items-center justify-between gap-3 lg:flex">
            <BrandCard />
            <div className="flex shrink-0 items-center gap-2">
              <HeaderActionButton href="/profile" label="محفوظاتي" icon={BookmarkCheck} pathname={pathname} />
              <HeaderActionButton href="/settings" label="الإعدادات" icon={Settings} pathname={pathname} />
              <ThemeToggle />
            </div>
          </div>

          <div className="relative hidden pt-3 lg:block">
            <nav className="flex flex-wrap items-center gap-2 rounded-[1.7rem] border border-[#d8c094]/35 bg-white/70 p-2 shadow-inner shadow-[#3f5638]/5 ring-1 ring-white/70 dark:!border-[#2d3f30] dark:!bg-[#07141a] dark:shadow-black/30 dark:ring-[#d8c094]/15">
              {navLinks.map((link, index) => (
                <DesktopNavLink key={link.href} link={link} pathname={pathname} index={index} />
              ))}
            </nav>
          </div>

          <div className="relative grid max-w-full gap-3 overflow-hidden lg:hidden">
            <div className="flex items-center gap-2">
              <BrandCard />
              <div className="mr-auto flex shrink-0 items-center gap-1.5">
                <HeaderActionButton href="/profile" label="محفوظاتي" icon={BookmarkCheck} pathname={pathname} />
                <HeaderActionButton href="/settings" label="الإعدادات" icon={Settings} pathname={pathname} />
                <ThemeToggle />
              </div>
            </div>

            <div className="relative max-w-full overflow-hidden rounded-[1.7rem] border border-[#d8c094]/35 bg-white/70 p-1.5 shadow-inner shadow-[#3f5638]/5 ring-1 ring-white/70 dark:!border-[#2d3f30] dark:!bg-[#07141a] dark:shadow-black/30 dark:ring-[#d8c094]/15">
              <nav className="rifq-mobile-safe-scroll flex w-full min-w-0 items-center gap-1.5 overscroll-x-contain pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navLinks.map((link) => (
                  <MobileNavLink key={link.href} link={link} pathname={pathname} />
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
