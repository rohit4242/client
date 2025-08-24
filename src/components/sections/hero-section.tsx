"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight } from "lucide-react";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const heroStats = [
  { value: "99.9%", label: "Uptime" },
  { value: "50ms", label: "Avg Response" },
  { value: "24/7", label: "Trading" },
  { value: "15+", label: "Exchanges" }
];

export const HeroSection = () => {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp}>
          <Badge variant="secondary" className="mb-6 px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            The Missing Link Between Strategy & Execution
          </Badge>
        </motion.div>
        
                  <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            variants={fadeInUp}
          >
            <span className="gradient-text-primary">Transform Signals Into</span>
            <br />
            <span className="bg-gradient-to-r from-chart-2 via-primary to-chart-3 bg-clip-text text-transparent">Profitable Trades</span>
          </motion.h1>
        
        <motion.p 
          className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto"
          variants={fadeInUp}
        >
          Powerful, cloud-based platform that serves as the seamless bridge between real-time trading signals 
          from TradingView or JSON feeds and crypto exchanges. Deploy advanced bots with fine-grained control and automation.
        </motion.p>
        
        <motion.div 
          className="mb-16"
          variants={fadeInUp}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button size="lg" className="gradient-bg-primary text-primary-foreground hover:opacity-90 text-lg px-12 py-6 shadow-teal">
              Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Hero Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
          variants={staggerContainer}
        >
          {heroStats.map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center"
              variants={fadeInUp}
              whileHover={{ scale: 1.1 }}
            >
              <motion.div 
                className="text-2xl font-bold text-primary"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};
