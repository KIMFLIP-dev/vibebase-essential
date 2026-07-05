import { NavbarNew } from "@/components/common_new/navbar";
import { HeroNew } from "@/components/landing/hero";
import { FeaturesNew2 } from "@/components/landing/features2";
import { CurriculumNew } from "@/components/landing/curriculum";
import { CommunityNew } from "@/components/landing/community";
import { FAQNew } from "@/components/landing/faq";
import { CTANew } from "@/components/landing/cta";
import { FooterNew } from "@/components/landing/footer";

export default async function Index() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FB] font-sans">
      <NavbarNew />
      <main className="flex-1">
        <HeroNew />
        <FeaturesNew2 />
        <CurriculumNew />
        <CommunityNew />
        <FAQNew />
        <CTANew />
      </main>
      <FooterNew />
    </div>
  );
}
