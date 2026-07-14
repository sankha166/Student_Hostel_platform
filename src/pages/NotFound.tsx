import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center relative z-10 max-w-md"
      >
        {/* Animated 404 Number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className="relative inline-block">
            <span className="text-[120px] md:text-[160px] font-black leading-none gradient-text select-none">
              404
            </span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -top-2 -right-4 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"
            >
              <MapPin className="w-5 h-5 text-destructive" />
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-sm text-muted-foreground/70 mb-8 font-mono bg-muted/50 rounded-lg px-3 py-1.5 inline-block">
            {location.pathname}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            onClick={() => navigate("/")}
            className="gradient-primary text-primary-foreground rounded-xl h-11 gap-2 px-6"
          >
            <Home className="w-4 h-4" /> Go Home
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="rounded-xl h-11 gap-2 px-6"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/auth?role=student")}
            className="rounded-xl h-11 gap-2 px-6"
          >
            <Search className="w-4 h-4" /> Find Hostels
          </Button>
        </motion.div>

        {/* Logo at bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex items-center justify-center gap-2 text-muted-foreground"
        >
          <img src="/iconn.png" alt="Logo" className="w-6 h-6 object-contain opacity-50" />
          <span className="text-sm">Residential Nexus</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
