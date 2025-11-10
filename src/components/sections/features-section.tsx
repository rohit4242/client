"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/animated/animated-card";
import { SectionHeader } from "@/components/animated/section-header";
import { 
  Zap, 
  Bot, 
  Target, 
  BarChart3, 
  Users, 
  LineChart, 
  Settings, 
  Smartphone, 
  Shield 
} from "lucide-react";

const features = [
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Signal-to-Exchange Automation",
    description: "Transform TradingView alerts or JSON signals into live trades with dynamic variable automation and multi-API configurations."
  },
  {
    icon: <Bot className="w-8 h-8" />,
    title: "Advanced Bot Strategies",
    description: "Deploy DCA, Grid, Signal-based, Market Neutral, AI-assisted, Spread/Arbitrage, and Futures-focused bots."
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "Smart Trading Terminal",
    description: "Multi-entry orders, multiple Take Profit levels, Stop Loss, trailing stops, and move-to-breakeven adjustments."
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Grid Bot Automation",
    description: "Execute grid strategies with customizable price ranges, levels, and automatic buy-sell order loops."
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Copy Trading & Marketplace",
    description: "User-run marketplaces for signal providers and followers with full analytics and performance tracking."
  },
  {
    icon: <LineChart className="w-8 h-8" />,
    title: "Portfolio Tracking & Paper Trading",
    description: "Simulated trading environments, real-time portfolio tracking, and risk-free backtesting capabilities."
  },
  {
    icon: <Settings className="w-8 h-8" />,
    title: "Smart Trading Optimization",
    description: "Multi-pair bots, simultaneous orders, trailing mechanisms, backtesting, and auto-reinvesting features."
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: "Mobile Access & Templates",
    description: "Pre-set bot templates, technical indicators, mobile apps, and centralized trading terminals."
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Enterprise Security",
    description: "API encryption, IP whitelisting, cloud-based uptime, and no withdrawal permissions required."
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="container mx-auto px-4 py-20">
      <SectionHeader
        title="Powerful Features for Every Trader"
        description="From signal automation to advanced bot strategies, BYTIX.ai provides everything you need for successful crypto trading."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <AnimatedCard key={index} index={index}>
            <Card className={`h-full border-muted/50 hover:border-primary/30 transition-all duration-300 ${
              index % 3 === 0 ? 'hover:shadow-teal' :
              index % 3 === 1 ? 'hover:shadow-rose' : 'hover:shadow-blue'
            }`}>
              <CardHeader>
                <motion.div 
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    index % 3 === 0 ? 'bg-gradient-to-br from-chart-1/20 to-chart-3/20' :
                    index % 3 === 1 ? 'bg-gradient-to-br from-chart-2/20 to-chart-4/20' :
                    'bg-gradient-to-br from-chart-3/20 to-chart-5/20'
                  }`}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 5
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <motion.div 
                    className={`${
                      index % 3 === 0 ? 'text-chart-1' :
                      index % 3 === 1 ? 'text-chart-2' : 'text-chart-3'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {feature.icon}
                  </motion.div>
                </motion.div>
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
    </section>
  );
};
