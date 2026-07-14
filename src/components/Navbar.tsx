import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
    setMobileOpen(false);
  };

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Explore", to: user?.role === "student" ? "/student" : "/auth?role=student" },
    { label: "For Owners", to: user?.role === "owner" ? "/owner" : "/auth?role=owner" },
    { label: "Home Delivery", to: "/food" },
  ];

  const handleNavClick = (to: string) => {
    navigate(to);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
            <img src="/iconn.png" alt="Logo" className="w-8 h-8 object-contain" />
            Residential Nexus
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.label} to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center gap-2">
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

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-card border-l border-border z-[60] md:hidden flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <img src="/iconn.png" alt="Logo" className="w-7 h-7 object-contain" />
                  Menu
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X size={18} />
                </Button>
              </div>

              <nav className="flex-1 p-4 space-y-1">
                {navLinks.map(link => (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.to)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-border space-y-2">
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl gap-2 justify-start"
                      onClick={() => handleNavClick(user.role === "student" ? "/student/profile" : "/owner/profile")}
                    >
                      <User size={16} /> My Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl gap-2 justify-start text-destructive hover:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => handleNavClick("/auth?role=student")}>
                      Log In
                    </Button>
                    <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={() => handleNavClick("/auth?role=student")}>
                      Sign Up Free
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
