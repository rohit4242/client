"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/animated/section-header";
import { 
  Zap, 
  Bot, 
  Target, 
  BarChart3, 
  Users, 
  CheckCircle 
} from "lucide-react";

const capabilityTabs = [
  {
    id: "signals",
    label: "Signal Engine",
    icon: <Zap className="w-6 h-6 mr-3 text-primary" />,
    title: "Signal-to-Bot Engine",
    description: "Transform any TradingView alert or JSON feed into live trades with ultimate flexibility and control.",
    sections: [
      {
        title: "Key Features:",
        items: [
          "Custom variable automation",
          "Multi-API configurations",
          "Real-time signal processing",
          "Dynamic execution logic"
        ]
      },
      {
        title: "Supported Sources:",
        items: [
          "TradingView webhooks",
          "JSON API feeds",
          "Custom indicators",
          "Third-party signals"
        ]
      }
    ]
  },
  {
    id: "bots",
    label: "Bot Strategies",
    icon: <Bot className="w-6 h-6 mr-3 text-primary" />,
    title: "Advanced Bot Strategies",
    description: "Deploy sophisticated trading bots with advanced strategies tailored for volatile crypto markets.",
    sections: [
      {
        title: "Core Strategies:",
        items: [
          "DCA (Dollar Cost Average)",
          "Grid Trading",
          "Signal-based Trading",
          "Market Neutral"
        ]
      },
      {
        title: "Advanced Types:",
        items: [
          "AI-assisted Bots",
          "Spread/Arbitrage",
          "Futures-focused",
          "Dynamic Scripting"
        ]
      },
      {
        title: "Features:",
        items: [
          "Trailing Stops",
          "Breakeven Moves",
          "Dynamic Position Sizing",
          "Risk Management"
        ]
      }
    ]
  },
  {
    id: "terminal",
    label: "Smart Terminal",
    icon: <Target className="w-6 h-6 mr-3 text-primary" />,
    title: "Smart Trading Terminal",
    description: "Execute complex trading strategies with multiple entry/exit points across multiple exchange accounts.",
    sections: [
      {
        title: "Order Management:",
        items: [
          "Multi-entry orders",
          "Multiple Take Profit levels",
          "Advanced Stop Loss",
          "Trailing stops"
        ]
      },
      {
        title: "Advanced Features:",
        items: [
          "Move-to-breakeven",
          "Simultaneous orders",
          "Multi-exchange support",
          "Unified interface"
        ]
      }
    ]
  },
  {
    id: "grid",
    label: "Grid Trading",
    icon: <BarChart3 className="w-6 h-6 mr-3 text-primary" />,
    title: "Grid Trading Engine",
    description: "Execute sophisticated grid strategies with customizable parameters for maximum profit opportunities.",
    sections: [
      {
        title: "Grid Strategies:",
        items: [
          "Trend following",
          "Mean-reversion",
          "Scalping grids",
          "Market-making"
        ]
      },
      {
        title: "Customization:",
        items: [
          "Custom price ranges",
          "Adjustable grid levels",
          "Automatic order loops",
          "Dynamic adjustments"
        ]
      }
    ]
  },
  {
    id: "copy",
    label: "Copy Trading",
    icon: <Users className="w-6 h-6 mr-3 text-primary" />,
    title: "Copy Trading & Strategy Marketplace",
    description: "Follow expert traders or publish your own strategies in our comprehensive marketplace ecosystem.",
    sections: [
      {
        title: "For Followers:",
        items: [
          "Expert trader access",
          "Performance analytics",
          "Risk assessment",
          "Automated copying"
        ]
      },
      {
        title: "For Providers:",
        items: [
          "Strategy monetization",
          "Trustworthiness metrics",
          "Private/public modes",
          "Full analytics dashboard"
        ]
      }
    ]
  }
];

export const CapabilitiesSection = () => {
  const [activeTab, setActiveTab] = useState("signals");

  return (
    <section id="capabilities" className="gradient-bg-accent py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Advanced Trading Capabilities"
          description="Explore the powerful features that make BYTIX.ai the ultimate crypto trading automation platform"
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 mb-8">
            {capabilityTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {capabilityTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    {tab.icon}
                    {tab.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg text-muted-foreground">
                    {tab.description}
                  </p>
                  <div className={`grid grid-cols-1 ${tab.sections.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                    {tab.sections.map((section, index) => (
                      <div key={index}>
                        <h4 className="font-semibold mb-2">{section.title}</h4>
                        <ul className="space-y-2 text-muted-foreground">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-primary mr-2" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};
