import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Users, UtensilsCrossed, User, ArrowRight, Star,
  Shield, Clock, MapPin, ChefHat, Truck, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const navigate = useNavigate();
  
  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-16">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 text-center">
          Manage Your Daily Food With <span className="gradient-text">Residential Nexus</span>
        </h2>
        {/* 🔥 NEW WRAPPER ADDED HERE */}
        <div className="grid md:grid-cols-2 gap-6 px-6 mt-10">

          {/* Student Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
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

              <Button className="rounded-xl gap-2 mt-4 w-full" onClick={() => navigate("/food")}>
                Order Food Now
              </Button>
            </CardContent>
          </Card>

          {/* Home Cook Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
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

              <Button className="rounded-xl gap-2 mt-4 w-full" onClick={() => navigate("/food")}>
                <ChefHat className="w-4 h-4" /> Register Your Kitchen
              </Button>
            </CardContent>
          </Card>

        </div>
    </main>
    <footer className="border-t border-border py-8 px-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-foreground">
            <img src="/iconn.png" alt="HostelAI Logo" className="w-8 h-8 object-contain" />
          Residential Nexus
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Residential Nexus. Built for students, powered by AI.</p>
      </div>
    </footer>
  </div>
);
};

export default Index;
