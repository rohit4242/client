"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/animated/section-header";
import { Globe, Activity, RefreshCw, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Connect Your Exchange APIs",
    description: "Securely link your crypto exchange accounts with enterprise-grade API encryption and IP whitelisting.",
    icon: <Globe className="w-12 h-12" />
  },
  {
    step: "02", 
    title: "Link Your Signal Source",
    description: "Connect TradingView alerts, JSON feeds, or use our built-in technical indicators and strategies.",
    icon: <Activity className="w-12 h-12" />
  },
  {
    step: "03",
    title: "Configure & Automate",
    description: "Set up your bots with fine-grained control and let BYTIX.ai execute trades 24/7 in the cloud.",
    icon: <RefreshCw className="w-12 h-12" />
  }
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="gradient-bg-secondary py-20">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="How BYTIX.ai Works"
          description="Get started with automated crypto trading in three simple steps"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              className="text-center relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <motion.div 
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white ${
                  index === 0 ? 'bg-gradient-to-br from-chart-1 to-chart-3 shadow-teal' :
                  index === 1 ? 'bg-gradient-to-br from-chart-2 to-chart-4 shadow-rose' :
                  'bg-gradient-to-br from-chart-3 to-chart-5 shadow-blue'
                }`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {step.icon}
              </motion.div>
              <div className="text-sm font-mono text-primary mb-2">{step.step}</div>
              <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              {index < 2 && (
                <motion.div
                  className="hidden md:block absolute top-10 -right-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 + 0.5 }}
                >
                  <ArrowRight className="w-8 h-8 text-muted-foreground/30" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
