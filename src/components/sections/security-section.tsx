"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated/animated-card";
import { SectionHeader } from "@/components/ui/animated/section-header";
import { Lock, Shield, Globe } from "lucide-react";

const securityFeatures = [
  {
    icon: <Lock className="w-12 h-12" />,
    title: "API Encryption",
    description: "Enterprise-grade encryption for all API communications with IP whitelisting support."
  },
  {
    icon: <Shield className="w-12 h-12" />,
    title: "No Withdrawal Access",
    description: "We never request withdrawal permissions. Your funds remain secure on your exchange."
  },
  {
    icon: <Globe className="w-12 h-12" />,
    title: "Cloud Reliability",
    description: "99.9% uptime with automated failover systems for uninterrupted trading operations."
  }
];

export const SecuritySection = () => {
  return (
    <section id="security" className="gradient-bg-secondary py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Enterprise-Grade Security"
          description="Your funds stay on your exchange. We never ask for withdrawal permissions. Trade with confidence."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {securityFeatures.map((feature, index) => (
            <AnimatedCard key={index} index={index}>
              <Card className="text-center hover:shadow-lg transition-all duration-300 h-full">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-chart-1/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
};
