"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNavigation, BackToTopButton } from "@/components/ui/animated";
import { Shield, Lock, Eye, Database, UserCheck, Globe } from "lucide-react";

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
    id: "information-collection",
    title: "Information We Collect",
    icon: <Database className="w-6 h-6" />,
    content: [
      {
        subtitle: "Personal Information",
        text: "We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This may include your name, email address, phone number, and payment information."
      },
      {
        subtitle: "Usage Information",
        text: "We automatically collect information about your use of our platform, including your IP address, browser type, operating system, referring URLs, access times, and pages viewed."
      },
      {
        subtitle: "Trading Data",
        text: "We collect information about your trading activities, including transaction history, bot configurations, and performance metrics to provide and improve our services."
      }
    ]
  },
  {
    id: "information-use",
    title: "How We Use Your Information",
    icon: <UserCheck className="w-6 h-6" />,
    content: [
      {
        subtitle: "Service Provision",
        text: "We use your information to provide, maintain, and improve our trading automation services, process transactions, and provide customer support."
      },
      {
        subtitle: "Communication",
        text: "We may use your contact information to send you technical notices, updates, security alerts, and administrative messages."
      },
      {
        subtitle: "Analytics and Improvement",
        text: "We analyze usage patterns to understand how our services are used and to improve functionality, security, and user experience."
      }
    ]
  },
  {
    id: "information-sharing",
    title: "Information Sharing and Disclosure",
    icon: <Globe className="w-6 h-6" />,
    content: [
      {
        subtitle: "Service Providers",
        text: "We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, and customer service."
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose your information if required to do so by law or in response to valid requests by public authorities."
      },
      {
        subtitle: "Business Transfers",
        text: "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction."
      }
    ]
  },
  {
    id: "data-security",
    title: "Data Security",
    icon: <Lock className="w-6 h-6" />,
    content: [
      {
        subtitle: "Security Measures",
        text: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction."
      },
      {
        subtitle: "Encryption",
        text: "All sensitive data is encrypted both in transit and at rest using industry-standard encryption protocols."
      },
      {
        subtitle: "Access Controls",
        text: "We maintain strict access controls and regularly audit our systems to ensure the security of your information."
      }
    ]
  },
  {
    id: "your-rights",
    title: "Your Rights and Choices",
    icon: <Eye className="w-6 h-6" />,
    content: [
      {
        subtitle: "Access and Correction",
        text: "You have the right to access, update, or correct your personal information. You can do this through your account settings or by contacting us."
      },
      {
        subtitle: "Data Portability",
        text: "You have the right to request a copy of your personal information in a structured, commonly used format."
      },
      {
        subtitle: "Deletion",
        text: "You may request that we delete your personal information, subject to certain legal and operational requirements."
      }
    ]
  }
];

export default function PrivacyPage() {
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
              <Shield className="w-4 h-4 mr-2" />
              Privacy Policy
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            variants={fadeInUp}
          >
            <span className="gradient-text-primary">Your Privacy</span>
            <br />
            <span className="bg-gradient-to-r from-chart-2 via-primary to-chart-3 bg-clip-text text-transparent">Matters to Us</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            This Privacy Policy explains how BYTIX.ai collects, uses, and protects your information when you use our services.
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

      {/* Privacy Policy Sections */}
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

      {/* Additional Information */}
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
                <CardTitle className="text-2xl">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-left">
                <div>
                  <h4 className="font-semibold mb-2">Cookies and Tracking Technologies</h4>
                  <p className="text-muted-foreground">
                    We use cookies and similar tracking technologies to collect and use personal information about you. 
                    For further information about the types of cookies we use, please refer to our Cookie Policy.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">International Data Transfers</h4>
                  <p className="text-muted-foreground">
                    Your information may be transferred to and processed in countries other than your own. 
                    We ensure appropriate safeguards are in place to protect your personal information.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Changes to This Policy</h4>
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                    the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Contact Us</h4>
                  <p className="text-muted-foreground">
                    If you have any questions about this Privacy Policy, please contact us at{" "}
                    <a href="mailto:privacy@bytix.ai" className="text-primary hover:underline">
                      privacy@bytix.ai
                    </a>{" "}
                    or through our{" "}
                    <a href="/contact" className="text-primary hover:underline">
                      contact page
                    </a>.
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
