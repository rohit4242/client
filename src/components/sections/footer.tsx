"use client";

import { motion } from "framer-motion";
import { Bot, Twitter, Github, Linkedin, Mail, Shield, Globe } from "lucide-react";

const footerSections = {
  product: [
    "Signal Automation",
    "Trading Bots",
    "Grid Trading",
    "Copy Trading",
    "Portfolio Tracking",
    "Paper Trading"
  ],
      company: [
      { name: "About Us", href: "/about" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Security", href: "#security" },
      { name: "Contact", href: "/contact" }
    ]
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" }
];

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-card via-muted/50 to-accent/20 border-t border-primary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <motion.div 
            className="md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <Bot className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <span className="text-2xl font-bold">BYTIX.ai</span>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              The Missing Link Between Strategy & Execution. Transform your trading signals into profitable automated trades.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-muted hover:bg-primary/10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="font-semibold mb-4 text-foreground">Product</h3>
            <ul className="space-y-3">
              {footerSections.product.map((item) => (
                <motion.li key={item} whileHover={{ x: 5 }}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
                          <h3 className="font-semibold mb-4 text-foreground">Company</h3>
              <ul className="space-y-3">
                {footerSections.company.map((item) => (
                  <motion.li key={item.name} whileHover={{ x: 5 }}>
                    <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                      {item.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
          </motion.div>
        </div>

        {/* Newsletter Signup */}
        <motion.div 
          className="border-t border-border pt-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="max-w-md mx-auto text-center">
            <h3 className="font-semibold mb-2">Stay Updated</h3>
            <p className="text-muted-foreground mb-4">Get the latest updates on new features and trading strategies.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
                              <motion.button
                  className="px-6 py-2 gradient-bg-primary text-primary-foreground rounded-lg font-medium shadow-teal"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Subscribe
                </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2024 BYTIX.ai. All rights reserved. Built with ❤️ for crypto traders worldwide.
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Enterprise Security
            </span>
            <span className="flex items-center">
              <Globe className="w-4 h-4 mr-1" />
              99.9% Uptime
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
