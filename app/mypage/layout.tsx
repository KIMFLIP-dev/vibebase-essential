import { NavbarNew } from '@/components/common/navbar'
import { FooterNew } from '@/components/landing/footer'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col">
      <NavbarNew />
      <div className="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full p-5 pt-36">{children}</div>
      <FooterNew />
    </main>
  )
}
