import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Sliders, Upload, Sparkles, MapPin, Star, ArrowRight, User, LogOut, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { hostelService, type Hostel } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([6000]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchImage, setSearchImage] = useState<File | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  const LOCATIONS = ["All Locations", "Koramangala", "HSR Layout", "BTM Layout", "Whitefield", "Indiranagar"];
  const FACILITIES = ["Wi-Fi", "AC", "Meals", "Gym"];

  const toggleFacility = (f: string) => {
    setSelectedFacilities(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  const allHostels = useMemo(() => hostelService.getAll(), []);

  const filteredHostels = useMemo(() => allHostels.filter(h => {
    const matchesPrice = h.price <= priceRange[0];
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      h.name.toLowerCase().includes(q) ||
      h.location.toLowerCase().includes(q) ||
      h.tags.some(t => t.toLowerCase().includes(q)) ||
      h.facilities.some(f => f.toLowerCase().includes(q)) ||
      h.whyRecommended.toLowerCase().includes(q);
    const matchesLocation = selectedLocation === "All Locations" ||
      h.location.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesFacilities = selectedFacilities.length === 0 ||
      selectedFacilities.every(f => h.facilities.some(hf => hf.toLowerCase().includes(f.toLowerCase())));
    return matchesPrice && matchesSearch && matchesLocation && matchesFacilities;
  }), [searchQuery, priceRange, selectedLocation, selectedFacilities]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSearchImage(e.target.files[0]);
  };
  const hostelTypeConfig: Record<
  "male" | "female" | "quadruple",
  { label: string; style: string }
> = {
  male: {
    label: "👨 Male",
    style: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  female: {
    label: "👩 Female",
    style: "bg-pink-100 text-pink-700 border border-pink-200",
  },
  quadruple: {
    label: "👥 Quad",
    style: "bg-green-100 text-green-700 border border-green-200",
  },
};

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl text-foreground">
            <img src="/iconn.png" alt="HostelAI Logo" className="w-8 h-8 object-contain" />
            
            Residential Nexus
          </button>

          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hostels..."
                className="pl-10 rounded-xl bg-secondary border-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/food")} className="text-muted-foreground">
              Food
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/student/rent")} className="text-muted-foreground">
              My Rent
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/student/profile")} className="rounded-full bg-primary/10">
              <User size={18} className="text-primary" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { logout(); navigate("/"); }}
              aria-label="Logout"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Smart Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Find Your Hostel</h1>
          <p className="text-muted-foreground mb-6">Describe what you're looking for — our AI does the rest.</p>

          <div className="glass-card-elevated rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="text-primary" size={20} aria-hidden="true" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find quiet, affordable hostels with good food near campus..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
                aria-label="Search hostels"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowFilters(!showFilters)} 
                className="rounded-xl shrink-0"
                aria-label={showFilters ? "Hide filters" : "Show filters"}
              >
                <Sliders size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card rounded-2xl p-6 mb-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">Price Range: ₹{priceRange[0].toLocaleString()}/mo</label>
                  <Slider value={priceRange} onValueChange={setPriceRange} max={10000} min={1000} step={500} className="mt-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>₹1,000</span><span>₹10,000</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    className="w-full rounded-xl bg-secondary border-0 px-3 py-2 text-sm"
                  >
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">Facilities</label>
                  <div className="space-y-2">
                    {FACILITIES.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <Checkbox
                          id={f}
                          checked={selectedFacilities.includes(f)}
                          onCheckedChange={() => toggleFacility(f)}
                        />
                        <label htmlFor={f} className="text-sm text-muted-foreground cursor-pointer">{f}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {(selectedLocation !== "All Locations" || selectedFacilities.length > 0) && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Active filters:</span>
                  {selectedLocation !== "All Locations" && (
                    <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setSelectedLocation("All Locations")}>
                      {selectedLocation} <X size={10} />
                    </Badge>
                  )}
                  {selectedFacilities.map(f => (
                    <Badge key={f} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => toggleFacility(f)}>
                      {f} <X size={10} />
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto" onClick={() => { setSelectedLocation("All Locations"); setSelectedFacilities([]); }}>
                    Clear all
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Image Upload */}
          <label className="flex flex-col items-center justify-center text-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/30 transition-colors">
                    <Upload size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{searchImage ? searchImage.name : "Drag & drop a room photo to find similar hostels"}</p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                  </label>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-6">
            <img src="/iconn.png" alt="HostelAI Logo" className="w-6 h-6 object-contain" />
            <h2 className="text-xl font-semibold text-foreground">AI Recommendations</h2>
            <Badge variant="outline" className="ml-auto">{filteredHostels.length} results</Badge>
          </div>

          {filteredHostels.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No hostels found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" className="rounded-xl" onClick={() => { setSearchQuery(""); setPriceRange([6000]); setSelectedLocation("All Locations"); setSelectedFacilities([]); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHostels.map((hostel, i) => (
              <motion.div
                key={hostel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="glass-card rounded-2xl overflow-hidden hover-lift cursor-pointer group"
                onClick={() => navigate(`/student/hostel/${hostel.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={hostel.image} alt={hostel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 gradient-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    {hostel.matchPercent}% match
                  </div>
                  <div
                  className={`absolute top-12 right-3 text-xs font-semibold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm ${
                  hostelTypeConfig[hostel.maleOrFemaleOrQuadruple].style}`}>
                  {hostelTypeConfig[hostel.maleOrFemaleOrQuadruple].label}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{hostel.name}</h3>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="text-amber-400 fill-amber-400" size={14} />
                      <span className="text-foreground font-medium">{hostel.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin size={14} /> {hostel.location}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {hostel.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs rounded-full">{tag}</Badge>
                    ))}
                  </div>
                  <div className="bg-primary/5 rounded-xl p-3 mb-3">
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Sparkles className="text-primary shrink-0 mt-0.5" size={12} />
                      {hostel.whyRecommended}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-foreground">₹{hostel.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                    <Button size="sm" variant="ghost" className="text-primary gap-1">
                      View <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
