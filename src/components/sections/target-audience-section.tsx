"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated/animated-card";
import { SectionHeader } from "@/components/ui/animated/section-header";
import { TrendingUp, Bot, Wallet, Star, CheckCircle } from "lucide-react";

const audiences = [
  {
    title: "Signal Traders",
    description: "Perfect for traders who rely on TradingView alerts or custom JSON signals for their strategies.",
    icon: <TrendingUp className="w-8 h-8" />,
    features: ["TradingView Integration", "Custom Signal Processing", "Real-time Execution"]
  },
  {
    title: "Bot Enthusiasts", 
    description: "Advanced users who want more control and customization than basic preset templates offer.",
    icon: <Bot className="w-8 h-8" />,
    features: ["Custom Bot Logic", "Advanced Strategies", "Fine-grained Control"]
  },
  {
    title: "Portfolio Managers",
    description: "Professionals managing multiple exchange accounts and complex trading strategies.",
    icon: <Wallet className="w-8 h-8" />,
    features: ["Multi-Exchange Support", "Portfolio Analytics", "Risk Management"]
  },
  {
    title: "Crypto Professionals",
    description: "Traders needing execution speed, reliability, and multi-strategy deployment capabilities.",
    icon: <Star className="w-8 h-8" />,
    features: ["Enterprise Features", "99.9% Uptime", "Professional Support"]
  }
];

export const TargetAudienceSection = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      <SectionHeader
        title="Built for Every Type of Trader"
        description="Whether you're a signal trader, bot enthusiast, portfolio manager, or crypto professional, BYTIX.ai has you covered."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {audiences.map((audience, index) => (
          <AnimatedCard key={index} index={index}>
            <Card className="text-center hover:shadow-lg transition-all duration-300 h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-chart-1/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-primary">
                    {audience.icon}
                  </div>
                </div>
                <CardTitle className="text-xl">{audience.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base mb-4 leading-relaxed">
                  {audience.description}
                </CardDescription>
                <div className="space-y-2">
                  {audience.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-center text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        ))}
      </div>
    </section>
  );
};
