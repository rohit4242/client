"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedNavigation, BackToTopButton } from "@/components/ui/animated";
import { SectionHeader } from "@/components/ui/animated/section-header";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageCircle,
  Headphones,
  Users,
  Shield,
  Zap
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

const contactInfo = [
  {
    icon: <Mail className="w-6 h-6" />,
    title: "Email Us",
    description: "Get in touch via email",
    value: "hello@bytix.ai",
    action: "mailto:hello@bytix.ai"
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Live Chat",
    description: "Chat with our support team",
    value: "Available 24/7",
    action: "#"
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: "Phone Support",
    description: "Call us for urgent matters",
    value: "+1 (555) 123-4567",
    action: "tel:+15551234567"
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Office Location",
    description: "Visit our headquarters",
    value: "San Francisco, CA",
    action: "#"
  }
];

const supportTypes = [
  {
    icon: <Headphones className="w-8 h-8" />,
    title: "Technical Support",
    description: "Get help with platform issues, API integration, and bot configuration."
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Sales Inquiries",
    description: "Learn about our plans, enterprise solutions, and custom integrations."
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Security Concerns",
    description: "Report security issues or get help with account security."
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Feature Requests",
    description: "Suggest new features or improvements to our platform."
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
    
    // Show success message (you can implement toast notifications)
    alert('Thank you for your message! We\'ll get back to you soon.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Us
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            variants={fadeInUp}
          >
            <span className="gradient-text-primary">Get in Touch</span>
            <br />
            <span className="bg-gradient-to-r from-chart-2 via-primary to-chart-3 bg-clip-text text-transparent">We&apos;re Here to Help</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            Have questions about BYTIX.ai? Need technical support? Want to explore enterprise solutions? 
            Our team is ready to assist you with anything you need.
          </motion.p>
        </motion.div>
      </section>

      {/* Contact Information */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          title="Contact Information"
          description="Multiple ways to reach our team"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {contactInfo.map((info, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className={`h-full text-center cursor-pointer ${
                index % 3 === 0 ? 'hover:shadow-teal' :
                index % 3 === 1 ? 'hover:shadow-rose' : 'hover:shadow-blue'
              } transition-all duration-300`}>
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                    index % 3 === 0 ? 'bg-gradient-to-br from-chart-1/20 to-chart-3/20' :
                    index % 3 === 1 ? 'bg-gradient-to-br from-chart-2/20 to-chart-4/20' :
                    'bg-gradient-to-br from-chart-3/20 to-chart-5/20'
                  }`}>
                    <div className={`${
                      index % 3 === 0 ? 'text-chart-1' :
                      index % 3 === 1 ? 'text-chart-2' : 'text-chart-3'
                    }`}>
                      {info.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-2">
                    {info.description}
                  </CardDescription>
                  <a 
                    href={info.action}
                    className="text-primary font-medium hover:underline"
                  >
                    {info.value}
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Form & Support Types */}
      <section className="gradient-bg-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="shadow-teal">
                <CardHeader>
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we&apos;ll get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                          Full Name *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2">
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="What's this about?"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full gradient-bg-primary text-primary-foreground shadow-teal"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="ml-2 w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Support Types */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-4">How Can We Help?</h3>
                  <p className="text-muted-foreground mb-8">
                    Choose the type of support you need, and we&apos;ll connect you with the right team member.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {supportTypes.map((type, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <Card className="cursor-pointer hover:shadow-md transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-lg ${
                              index % 3 === 0 ? 'bg-chart-1/20 text-chart-1' :
                              index % 3 === 1 ? 'bg-chart-2/20 text-chart-2' : 'bg-chart-3/20 text-chart-3'
                            }`}>
                              {type.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1">{type.title}</h4>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                
                {/* Business Hours */}
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Clock className="w-5 h-5 mr-2 text-primary" />
                      Business Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monday - Friday</span>
                        <span className="text-muted-foreground">9:00 AM - 6:00 PM PST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday</span>
                        <span className="text-muted-foreground">10:00 AM - 4:00 PM PST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday</span>
                        <span className="text-muted-foreground">Closed</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="font-medium">Emergency Support</span>
                          <span className="text-primary">24/7 Available</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <BackToTopButton />
    </div>
  );
}
