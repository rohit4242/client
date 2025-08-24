"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight } from "lucide-react";
import Link from "next/link";

interface AnimatedNavigationProps {
  onSectionClick: (sectionId: string) => void;
}

export const AnimatedNavigation = ({
  onSectionClick,
}: AnimatedNavigationProps) => {
  const navItems = [
    { id: "features", label: "Features" },
    { id: "how-it-works", label: "How It Works" },
    { id: "capabilities", label: "Capabilities" },
    { id: "security", label: "Security" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
        >
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Bot className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-bold">BYTIX.ai</span>
          </Link>
        </motion.div>

        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => onSectionClick(item.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              {item.label}
            </motion.button>
          ))}
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="gradient-bg-primary text-primary-foreground hover:opacity-90 shadow-teal">
            <Link href="/sign-up" className="flex items-center">
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </motion.nav>
  );
};
