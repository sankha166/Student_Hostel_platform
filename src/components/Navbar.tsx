import { Link } from "react-router-dom";
import { Sparkles, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
//import ProfileMenu from "./ProfileMenu";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }

    setDarkMode(!darkMode);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
          <img src="/iconn.png" alt="Logo" className="w-8 h-8 object-contain" />
          Resedential Nexus
        </Link>

        {/* Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
          <Link to="/student" className="text-sm text-muted-foreground hover:text-foreground">Explore</Link>
          <Link to="/owner" className="text-sm text-muted-foreground hover:text-foreground">For Owners</Link>
          <Link to="/food" className="text-sm text-muted-foreground hover:text-foreground">Home Delivery</Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          
          {/* 🌙 THEME TOGGLE BUTTON */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth?role=student">Log In</Link>
          </Button>

          <Button size="sm" className="gradient-primary text-primary-foreground rounded-lg" asChild>
            <Link to="/auth?role=student">Sign Up</Link>
          </Button>
      

        </div>
      </div>
    </nav>
  );
};

export default Navbar;