"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedNavigation, BackToTopButton } from "@/components/ui/animated";
import { SectionHeader } from "@/components/ui/animated/section-header";
import { 
  Target, 
  Users, 
  Zap, 
  Shield, 
  TrendingUp, 
  Globe,
  Award,
  Heart
} from "lucide-react";

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

const values = [
  {
    icon: <Target className="w-8 h-8" />,
    title: "Innovation First",
    description: "We constantly push the boundaries of what's possible in crypto trading automation."
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Security & Trust",
    description: "Your funds and data security are our top priority. We never compromise on safety."
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Community Driven",
    description: "We build for our users, listening to feedback and evolving with the community."
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Performance Excellence",
    description: "Lightning-fast execution and 99.9% uptime ensure you never miss an opportunity."
  }
];

const stats = [
  { value: "10,000+", label: "Active Traders" },
  { value: "$50M+", label: "Volume Traded" },
  { value: "15+", label: "Exchanges" },
  { value: "99.9%", label: "Uptime" }
];

const team = [
  {
    name: "Alex Chen",
    role: "CEO & Co-Founder",
    description: "Former Goldman Sachs quantitative trader with 10+ years in algorithmic trading."
  },
  {
    name: "Sarah Rodriguez",
    role: "CTO & Co-Founder",
    description: "Ex-Google engineer specializing in distributed systems and high-frequency trading."
  },
  {
    name: "Michael Kim",
    role: "Head of Product",
    description: "Former product lead at Coinbase, expert in crypto trading platforms and UX."
  },
  {
    name: "Emma Thompson",
    role: "Head of Security",
    description: "Cybersecurity expert with experience at major financial institutions."
  }
];

export default function AboutPage() {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      <AnimatedNavigation onSectionClick={scrollToSection} />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              About BYTIX.ai
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            variants={fadeInUp}
          >
            <span className="gradient-text-primary">Bridging the Gap Between</span>
            <br />
            <span className="bg-gradient-to-r from-chart-2 via-primary to-chart-3 bg-clip-text text-transparent">Strategy and Execution</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            Founded in 2023, BYTIX.ai was born from the frustration of manual trading and the gap between having a great strategy and executing it flawlessly. We&apos;re on a mission to democratize advanced trading automation for everyone.
          </motion.p>
        </motion.div>
      </section>

      {/* Mission & Vision */}
      <section className="gradient-bg-secondary py-20">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Our Mission & Vision"
            description="We believe that everyone should have access to institutional-grade trading tools"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full shadow-teal">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Target className="w-6 h-6 mr-3 text-chart-1" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    To democratize advanced crypto trading by providing powerful, user-friendly automation tools that bridge the gap between trading signals and profitable execution. We make institutional-grade trading accessible to everyone.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full shadow-rose">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Globe className="w-6 h-6 mr-3 text-chart-2" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    To become the global standard for crypto trading automation, empowering millions of traders worldwide with the tools they need to succeed in the digital asset revolution while maintaining the highest standards of security and reliability.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          title="Our Core Values"
          description="The principles that guide everything we do at BYTIX.ai"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className={`h-full text-center ${
                index % 3 === 0 ? 'hover:shadow-teal' :
                index % 3 === 1 ? 'hover:shadow-rose' : 'hover:shadow-blue'
              } transition-all duration-300`}>
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    index % 3 === 0 ? 'bg-gradient-to-br from-chart-1/20 to-chart-3/20' :
                    index % 3 === 1 ? 'bg-gradient-to-br from-chart-2/20 to-chart-4/20' :
                    'bg-gradient-to-br from-chart-3/20 to-chart-5/20'
                  }`}>
                    <div className={`${
                      index % 3 === 0 ? 'text-chart-1' :
                      index % 3 === 1 ? 'text-chart-2' : 'text-chart-3'
                    }`}>
                      {value.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="gradient-bg-accent py-20">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Our Impact"
            description="Numbers that showcase our growing community and platform success"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          title="Meet Our Team"
          description="The passionate individuals building the future of crypto trading automation"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full text-center hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-chart-1/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-10 h-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <div className="text-chart-2 font-medium">{member.role}</div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {member.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="gradient-bg-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Ready to Join Our Mission?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Be part of the trading automation revolution. Start your journey with BYTIX.ai today.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a 
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Get Started Now
                <TrendingUp className="ml-2 w-5 h-5" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <BackToTopButton />
    </div>
  );
}
