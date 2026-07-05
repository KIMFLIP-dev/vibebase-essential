'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Settings,
  Home,
  Download,
  Newspaper,
  Package,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
const mainNavItems = [
  {
    title: '대시보드',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
]

const managementNavItems = [
  {
    title: '회원 관리',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: '상품 관리',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: '구매 내역',
    href: '/admin/purchases',
    icon: ShoppingBag,
  },
  {
    title: '문의 관리',
    href: '/admin/inquiries',
    icon: MessageCircle,
  },
  {
    title: '다운로드 관리',
    href: '/admin/downloads',
    icon: Download,
  },
  {
    title: '블로그 관리',
    href: '/admin/posts',
    icon: Newspaper,
  },
]

const bottomNavItems = [
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

interface NavItemProps {
  item: {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }
  pathname: string
}

function NavItem({ item, pathname }: NavItemProps) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-[#B7B2FF] text-white'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.title}
    </Link>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#B7B2FF] rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 18 6-6-6-6" />
              <path d="m8 6-6 6 6 6" />
            </svg>
          </div>
          <span className="text-xl font-black italic text-[#111]">VibeBase</span>
          <span className="text-xs font-bold text-[#B7B2FF]">Admin</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4">
        <div className="space-y-4">
          {/* Home Section */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Home
            </p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          {/* Management Section */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Management
            </p>
            <nav className="space-y-1">
              {managementNavItems.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 mt-auto">
        <nav className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <Separator className="my-4" />

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-md">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <Home className="h-8 w-8" />
              Go to Main Site
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  )
}
