"use client";

import { AnimatedNavigation, BackToTopButton } from "@/components/ui/animated";
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  TargetAudienceSection,
  CapabilitiesSection,
  SecuritySection,
  Footer,
} from "@/components/sections";
import { useCallback } from "react";

export default function Home() {
  const scrollToSection = useCallback((sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      <AnimatedNavigation onSectionClick={scrollToSection} />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TargetAudienceSection />
      <CapabilitiesSection />
      <SecuritySection />
      <Footer />
      <BackToTopButton />
    </div>
  );
}
