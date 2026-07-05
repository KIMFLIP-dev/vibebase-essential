import { NavbarNew } from "@/components/common/navbar";
import { FooterNew } from "@/components/landing/footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <NavbarNew />
      <main className="flex-1">{children}</main>
      <FooterNew />
    </div>
  );
}
