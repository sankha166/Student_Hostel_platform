import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(d => !d);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
          <img src="/iconn.png" alt="Logo" className="w-8 h-8 object-contain" />
          Residential Nexus
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to={user?.role === "student" ? "/student" : "/auth?role=student"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
          <Link to={user?.role === "owner" ? "/owner" : "/auth?role=owner"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">For Owners</Link>
          <Link to="/food" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home Delivery</Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          {user ? (
            <>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to={user.role === "student" ? "/student/profile" : "/owner/profile"}>
                  <User size={15} />
                  <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={handleLogout} className="rounded-lg gap-1">
                <LogOut size={14} />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth?role=student">Log In</Link>
              </Button>
              <Button size="sm" className="gradient-primary text-primary-foreground rounded-lg" asChild>
                <Link to="/auth?role=student">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
