"use client";

import { AnimatedNavigation, BackToTopButton } from "@/components/animated";
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  TargetAudienceSection,
  CapabilitiesSection,
  SecuritySection,
  Footer,
} from "@/components/sections";
import { useCallback, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { getDashboardUrlByRole } from "@/lib/utils";

export default function Home() {
  const { data: session } = authClient.useSession();
  
  const scrollToSection = useCallback((sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    // Check if user is authenticated and redirect accordingly
    // Only redirect if we have a valid session with user data
    if (session?.user) {
      // Add a small delay to ensure session is fully loaded
      const timeoutId = setTimeout(() => {
        fetch("/api/auth/user-role")
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            return null;
          })
          .then((data) => {
            if (data?.role) {
              const redirectUrl = getDashboardUrlByRole(data.role);
              // Only redirect if we're not already on a different page
              if (window.location.pathname === '/') {
                window.location.href = redirectUrl;
              }
            }
          })
          .catch((error) => {
            // If there's an error, just show the landing page
            console.error("Auth check failed:", error);
          });
      }, 300); // Wait 300ms to ensure session is fully loaded

      return () => clearTimeout(timeoutId);
    }
  }, [session]);

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
