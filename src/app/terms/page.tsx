"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNavigation, BackToTopButton } from "@/components/ui/animated";
import { FileText, Scale, Shield, AlertTriangle, UserX, Gavel } from "lucide-react";

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

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    icon: <FileText className="w-6 h-6" />,
    content: [
      {
        subtitle: "Agreement to Terms",
        text: "By accessing and using BYTIX.ai services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
      },
      {
        subtitle: "Modifications",
        text: "We reserve the right to modify these terms at any time. Your continued use of the service after any such changes constitutes your acceptance of the new Terms of Service."
      }
    ]
  },
  {
    id: "service-description",
    title: "Service Description",
    icon: <Shield className="w-6 h-6" />,
    content: [
      {
        subtitle: "Platform Services",
        text: "BYTIX.ai provides cryptocurrency trading automation services, including but not limited to signal processing, bot creation, portfolio management, and exchange integration."
      },
      {
        subtitle: "Service Availability",
        text: "We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance and unforeseen circumstances may affect service availability."
      },
      {
        subtitle: "Third-Party Integrations",
        text: "Our service integrates with third-party cryptocurrency exchanges. We are not responsible for the availability, functionality, or security of these third-party services."
      }
    ]
  },
  {
    id: "user-responsibilities",
    title: "User Responsibilities",
    icon: <UserX className="w-6 h-6" />,
    content: [
      {
        subtitle: "Account Security",
        text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
      },
      {
        subtitle: "Compliance",
        text: "You agree to comply with all applicable laws and regulations in your jurisdiction when using our services, including but not limited to financial and tax regulations."
      },
      {
        subtitle: "Prohibited Activities",
        text: "You may not use our service for any illegal activities, market manipulation, money laundering, or any activities that violate exchange terms of service."
      }
    ]
  },
  {
    id: "financial-disclaimers",
    title: "Financial Disclaimers",
    icon: <AlertTriangle className="w-6 h-6" />,
    content: [
      {
        subtitle: "Investment Risk",
        text: "Cryptocurrency trading involves substantial risk of loss. Past performance does not guarantee future results. You should never invest more than you can afford to lose."
      },
      {
        subtitle: "No Financial Advice",
        text: "BYTIX.ai does not provide financial, investment, or trading advice. All trading decisions are made solely by you based on your own analysis and risk tolerance."
      },
      {
        subtitle: "Automated Trading Risks",
        text: "Automated trading systems carry inherent risks including system failures, connectivity issues, and unexpected market conditions that may result in losses."
      }
    ]
  },
  {
    id: "limitation-liability",
    title: "Limitation of Liability",
    icon: <Scale className="w-6 h-6" />,
    content: [
      {
        subtitle: "Service Limitations",
        text: "BYTIX.ai shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services."
      },
      {
        subtitle: "Maximum Liability",
        text: "In no event shall our total liability to you exceed the amount you paid for our services in the twelve months preceding the claim."
      },
      {
        subtitle: "Force Majeure",
        text: "We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, war, terrorism, or government actions."
      }
    ]
  },
  {
    id: "termination",
    title: "Termination",
    icon: <Gavel className="w-6 h-6" />,
    content: [
      {
        subtitle: "Termination by User",
        text: "You may terminate your account at any time by following the account closure process in your dashboard or contacting our support team."
      },
      {
        subtitle: "Termination by BYTIX.ai",
        text: "We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users or our business."
      },
      {
        subtitle: "Effect of Termination",
        text: "Upon termination, your right to use the service will cease immediately. All provisions of these Terms which by their nature should survive termination shall survive."
      }
    ]
  }
];

export default function TermsPage() {
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
              <Scale className="w-4 h-4 mr-2" />
              Terms of Service
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            variants={fadeInUp}
          >
            <span className="gradient-text-primary">Terms of</span>
            <br />
            <span className="bg-gradient-to-r from-chart-2 via-primary to-chart-3 bg-clip-text text-transparent">Service</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            These Terms of Service govern your use of BYTIX.ai and outline the rights and responsibilities of both parties.
          </motion.p>
          
          <motion.div 
            className="text-sm text-muted-foreground"
            variants={fadeInUp}
          >
            <p><strong>Last Updated:</strong> January 15, 2024</p>
            <p><strong>Effective Date:</strong> January 15, 2024</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Important Notice */}
      <section className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="max-w-4xl mx-auto border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="w-6 h-6 mr-2" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                <strong>Risk Warning:</strong> Cryptocurrency trading involves substantial risk of loss and is not suitable for all investors. 
                The high degree of leverage can work against you as well as for you. Before deciding to trade cryptocurrency, 
                you should carefully consider your investment objectives, level of experience, and risk appetite.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Table of Contents */}
      <section className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section, index) => (
                  <motion.a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    whileHover={{ x: 5 }}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="text-primary">{section.icon}</div>
                    <span className="font-medium">{section.title}</span>
                  </motion.a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Terms Sections */}
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-12">
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <div className={`p-2 rounded-lg mr-4 ${
                      sectionIndex % 3 === 0 ? 'bg-chart-1/20 text-chart-1' :
                      sectionIndex % 3 === 1 ? 'bg-chart-2/20 text-chart-2' : 'bg-chart-3/20 text-chart-3'
                    }`}>
                      {section.icon}
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <motion.div
                      key={itemIndex}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: itemIndex * 0.1 }}
                    >
                      <h4 className="font-semibold text-lg mb-2 text-foreground">
                        {item.subtitle}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.text}
                      </p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Information */}
      <section className="gradient-bg-secondary py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Questions About These Terms?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  If you have any questions about these Terms of Service, please don&apos;t hesitate to contact us.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-3 gradient-bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Contact Support
                  </a>
                  <a 
                    href="mailto:support@bytix.ai"
                    className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
                  >
                    Email Legal Team
                  </a>
                </div>
                
                <div className="text-sm text-muted-foreground pt-4 border-t">
                  <p>
                    <strong>BYTIX.ai Legal Department</strong><br />
                    Email: support@bytix.ai<br />
                    Address: New York, NY, United States
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <BackToTopButton />
    </div>
  );
}
