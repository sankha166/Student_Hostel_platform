import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Users, UtensilsCrossed, User, ArrowRight, Star,
  Shield, Clock, MapPin, ChefHat, Truck, Heart, Mail, Phone,
  Send, Facebook, Twitter, Instagram, Linkedin, Github
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-16">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />

      {/* ═══════════ Food Delivery Section ═══════════ */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 px-4 py-1 text-sm">
              <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5" /> New Feature
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Manage Your Daily Food With <span className="gradient-text">Residential Nexus</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect students with local home cooks for fresh, affordable, homemade meals delivered right to your hostel room.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <Card className="border-0 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">For Students</h4>
                      <p className="text-sm text-muted-foreground">
                        Order homemade food to your room
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary shrink-0" />
                      Browse local home cooks and their menus
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      Order breakfast, lunch, dinner or tiffin plans
                    </li>
                    <li className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary shrink-0" />
                      Get food delivered right to your hostel room
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary shrink-0" />
                      Rate and review cooks for quality
                    </li>
                  </ul>

                  <Button className="rounded-xl gap-2 mt-6 w-full" onClick={() => navigate("/food")}>
                    Order Food Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Home Cook Card */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <Card className="border-0 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">For Home Cooks</h4>
                      <p className="text-sm text-muted-foreground">
                        Turn your cooking into a business
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-600 shrink-0" />
                      Register your kitchen — housewives, home chefs welcome
                    </li>
                    <li className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0" />
                      List your meals with prices and availability
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                      Set delivery radius and operating hours
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                      Weekly payments directly to your account
                    </li>
                  </ul>

                  <Button variant="outline" className="rounded-xl gap-2 mt-6 w-full" onClick={() => navigate("/food")}>
                    <ChefHat className="w-4 h-4" /> Register Your Kitchen
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </main>

    {/* ═══════════ Premium Footer ═══════════ */}
    <footer className="bg-card border-t border-border">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3 className="text-2xl font-bold text-foreground mb-2">Stay in the Loop</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Get updates on new hostels, features, and exclusive deals for students.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 rounded-xl bg-secondary border-0 h-11"
                    required
                  />
                </div>
                <Button type="submit" className="gradient-primary text-primary-foreground rounded-xl h-11 px-6 gap-2">
                  {subscribed ? (
                    <><Star className="w-4 h-4" /> Subscribed!</>
                  ) : (
                    <><Send className="w-4 h-4" /> Subscribe</>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg text-foreground mb-4">
              <img src="/iconn.png" alt="Logo" className="w-8 h-8 object-contain" />
              Residential Nexus
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              AI-powered student accommodation platform — find your perfect room or manage your properties with ease.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Github, label: "GitHub" },
              ].map(s => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <s.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                { label: "Home", href: "/" },
                { label: "Find Hostels", href: "/auth?role=student" },
                { label: "For Owners", href: "/auth?role=owner" },
                { label: "Food Delivery", href: "/food" },
              ].map(link => (
                <li key={link.label}>
                  <button onClick={() => navigate(link.href)} className="hover:text-primary transition-colors">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* For Students */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">For Students</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                { label: "Search Rooms", href: "/auth?role=student" },
                { label: "My Rent & Bills", href: "/auth?role=student" },
                { label: "Order Food", href: "/food" },
                { label: "My Profile", href: "/auth?role=student" },
              ].map(link => (
                <li key={link.label}>
                  <button onClick={() => navigate(link.href)} className="hover:text-primary transition-colors">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Koramangala, Bangalore, Karnataka 560034</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>hello@residentialnexus.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Residential Nexus. Built for students, powered by AI.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button className="hover:text-primary transition-colors">Privacy Policy</button>
            <span className="text-border">·</span>
            <button className="hover:text-primary transition-colors">Terms of Service</button>
            <span className="text-border">·</span>
            <button className="hover:text-primary transition-colors">Support</button>
          </div>
        </div>
      </div>
    </footer>
  </div>
);
};

export default Index;
