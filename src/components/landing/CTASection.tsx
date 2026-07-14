import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="gradient-primary rounded-3xl p-12 lg:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(280_60%_55%/0.3),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Start Your Journey Today
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Whether you're a student looking for the perfect hostel or an owner wanting to list your property — we've got you covered.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth?role=student")}
                className="bg-card text-foreground hover:bg-card/90 rounded-xl gap-2 font-semibold"
              >
                Student Login <ArrowRight size={18} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth?role=owner")}
                className="border-primary-foreground/30  hover:bg-primary-foreground/10 rounded-xl gap-2"
              >
                Owner Login <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
