import { motion } from "framer-motion";
import { Brain, Clock, Camera, BarChart3, CreditCard, GraduationCap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Smart Search",
    description: "Find hostels based on lifestyle — like study-friendly or social.",
    gradient: "from-primary to-primary/70",
  },
  {
    icon: Camera,
    title: "Image-Based Discovery",
    description: "Upload a photo to find similar rooms instantly.",
    gradient: "from-accent to-accent/70",
  },
  {
    icon: Clock,
    title: "Instant Booking",
    description: "Book rooms instantly with online payment and get instant confirmation.",
    gradient: "from-accent to-accent/70",
  },
  {
    icon: GraduationCap,
    title: "Student-first Focus",
    description: "Only for student, simple, affordable, and reliable.",
    gradient: "from-primary to-accent",
  },
  {
    icon: BarChart3,
    title: "Owner Dashboard",
    description: "Track rent, occupancy, and tenants easily.",
    gradient: "from-primary to-accent",
  },
  {
    icon: CreditCard,
    title: "Easy Rent Tracking",
    description: "Never miss or forget payments with smart reminders.",
    gradient: "from-accent to-primary",
  },
];

const FeaturesSection = () => (
  <section className="py-24 px-6">
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          Why Choose <span className="gradient-text">Residential Nexus</span>?
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Powered by artificial intelligence to make your hostel search smarter, faster, and more personalized.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-6 hover-lift group cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <f.icon className="text-primary-foreground" size={24} />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
