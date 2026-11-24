'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Sprout, Calculator, UserCog } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/akademi', label: 'Akademi', icon: BookOpen },
  { href: '/kebun', label: 'Kebun', icon: Sprout },
  { href: '/bisnis', label: 'Bisnis', icon: Calculator },
  { href: '/profil', label: 'Profil', icon: UserCog },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-stone-200 px-1 py-2 flex justify-around items-center z-[9999]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              isActive ? 'text-emerald-700 bg-emerald-50' : 'text-stone-500 hover:text-emerald-700'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-stone-400'}`} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}