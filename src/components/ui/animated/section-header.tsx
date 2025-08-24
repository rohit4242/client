"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  description: string;
  className?: string;
}

export const SectionHeader = ({ title, description, className = "" }: SectionHeaderProps) => {
  return (
    <motion.div 
      className={`text-center mb-16 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        {description}
      </p>
    </motion.div>
  );
};
