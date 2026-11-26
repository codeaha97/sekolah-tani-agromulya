'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Sprout, Calculator, UserCog } from 'lucide-react'

const leftNavItems = [
  { href: '/dashboard', label: 'Beranda', icon: Home },
  { href: '/akademi', label: 'Akademi', icon: BookOpen },
]

const rightNavItems = [
  { href: '/bisnis', label: 'Bisnis', icon: Calculator },
  { href: '/profil', label: 'Profil', icon: UserCog },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  const isRouteActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  const isKebunActive = isRouteActive('/kebun')

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-3 pt-1 pointer-events-none">
      <nav
        aria-label="Navigasi Utama Mobile"
        className="pointer-events-auto mx-auto max-w-md bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-2xl shadow-[0_8px_28px_-6px_rgba(6,78,59,0.16),0_2px_6px_-1px_rgba(0,0,0,0.06)] px-2 py-1.5"
      >
        <div className="grid grid-cols-5 items-end">
          {/* 2 Menu Kiri */}
          {leftNavItems.map((item) => {
            const Icon = item.icon
            const active = isRouteActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all active:scale-90"
              >
                {active && (
                  <span className="absolute top-0 w-5 h-0.5 rounded-full bg-emerald-600" />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active
                      ? 'text-emerald-700 stroke-[2.4]'
                      : 'text-stone-400 stroke-[1.9]'
                  }`}
                />
                <span
                  className={`text-[10px] leading-none tracking-tight ${
                    active ? 'font-bold text-emerald-900' : 'font-medium text-stone-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* Tombol Utama Tengah: KEBUN (Center Elevated App Action) */}
          <Link
            href="/kebun"
            className="flex flex-col items-center justify-center -mt-5 pb-1 active:scale-95 transition-transform"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ring-4 ring-white shadow-md transition-all ${
                isKebunActive
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-emerald-900/25 scale-105'
                  : 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-emerald-50'
              }`}
            >
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span
              className={`text-[10px] leading-none mt-1.5 tracking-tight ${
                isKebunActive ? 'font-bold text-emerald-800' : 'font-semibold text-stone-600'
              }`}
            >
              Kebun
            </span>
          </Link>

          {/* 2 Menu Kanan */}
          {rightNavItems.map((item) => {
            const Icon = item.icon
            const active = isRouteActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all active:scale-90"
              >
                {active && (
                  <span className="absolute top-0 w-5 h-0.5 rounded-full bg-emerald-600" />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active
                      ? 'text-emerald-700 stroke-[2.4]'
                      : 'text-stone-400 stroke-[1.9]'
                  }`}
                />
                <span
                  className={`text-[10px] leading-none tracking-tight ${
                    active ? 'font-bold text-emerald-900' : 'font-medium text-stone-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}