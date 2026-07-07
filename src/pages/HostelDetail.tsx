import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Star, Wifi, Wind, Dumbbell, BookOpen,
  Sparkles, Shield, CalendarCheck, CheckCircle2, Phone, User, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hostelService, bookingService } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";

const facilityIcons: Record<string, typeof Wifi> = {
  "Wi-Fi": Wifi, "High-Speed Wi-Fi": Wifi, "AC": Wind, "Gym": Dumbbell,
  "Study Room": BookOpen, "Library": BookOpen, "Co-working Space": BookOpen,
};

const TIME_SLOTS = ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];

const HostelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const hostel = hostelService.getById(id || "");

  const [bookingOpen, setBookingOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [visitDone, setVisitDone] = useState(false);

  // Booking form
  const [moveInDate, setMoveInDate] = useState("");
  const [duration, setDuration] = useState("6");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Visit form
  const [visitName, setVisitName] = useState(user?.name || "");
  const [visitPhone, setVisitPhone] = useState(user?.phone || "");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [visitLoading, setVisitLoading] = useState(false);

  if (!hostel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Hostel not found</p>
          <Button onClick={() => navigate("/student")}>Back to Search</Button>
        </div>
      </div>
    );
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveInDate) return;
    setBookingLoading(true);
    await new Promise(r => setTimeout(r, 700));
    // Persist booking request
    bookingService.create({
      studentName: user?.name || "Student",
      phone: user?.phone || "",
      email: user?.email || "",
      type: "booking",
      preferredDate: moveInDate,
      message: `Booking for ${duration} months at ${hostel.name}`,
      advanceAmount: hostel.price * 2,
    });
    setBookingLoading(false);
    setBookingDone(true);
    toast({
      title: "Booking Request Sent!",
      description: `Your request for ${hostel.name} has been sent to the owner.`,
    });
  };

  const handleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate || !visitTime) return;
    setVisitLoading(true);
    await new Promise(r => setTimeout(r, 700));
    // Persist visit request
    bookingService.create({
      studentName: visitName || user?.name || "Student",
      phone: visitPhone || user?.phone || "",
      email: user?.email || "",
      type: "visit",
      preferredDate: `${visitDate} ${visitTime}`,
      message: visitNotes || `Visit to ${hostel.name}`,
    });
    setVisitLoading(false);
    setVisitDone(true);
    toast({
      title: "Visit Scheduled!",
      description: `Your visit to ${hostel.name} on ${visitDate} at ${visitTime} is confirmed.`,
    });
  };

  const totalDue = hostel.price * (parseInt(duration) || 1) + hostel.price * 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 sm:px-6 h-14 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></Button>
        <h1 className="font-semibold text-foreground truncate">{hostel.name}</h1>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        {/* Image */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl overflow-hidden h-64 md:h-96 mb-8">
          <img src={hostel.image} alt={hostel.name} className="w-full h-full object-cover" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Title */}
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{hostel.name}</h1>
                <Badge className="gradient-primary text-primary-foreground rounded-full">{hostel.matchPercent}% match</Badge>
                <Badge variant="outline">{hostel.maleOrFemaleOrQuadruple === "male" ? "👨 Male" : hostel.maleOrFemaleOrQuadruple === "female" ? "👩 Female" : "👥 Quad"}</Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={16} />{hostel.location}</span>
                <span className="flex items-center gap-1"><Star size={16} className="text-amber-400 fill-amber-400" />{hostel.rating}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {hostel.tags.map(t => (
                  <Badge key={t} variant="secondary" className="rounded-full">{t}</Badge>
                ))}
              </div>
            </div>

            {/* AI Explanation */}
            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-primary" size={18} />
                <span className="font-semibold text-foreground text-sm">Why this hostel?</span>
              </div>
              <p className="text-sm text-muted-foreground">{hostel.whyRecommended}</p>
            </div>

            {/* Facilities */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Facilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {hostel.facilities.map(f => {
                  const Icon = facilityIcons[f] || Shield;
                  return (
                    <div key={f} className="flex items-center gap-3 glass-card rounded-xl p-3">
                      <Icon className="text-primary shrink-0" size={18} />
                      <span className="text-sm text-foreground">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rules */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">House Rules</h3>
              <ul className="space-y-2">
                {hostel.rules.map(r => (
                  <li key={r} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="text-destructive shrink-0" size={14} /> {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Reviews */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Reviews</h3>
              <div className="space-y-4">
                {hostel.reviews.map(r => (
                  <div key={r.name} className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-sm">{r.name}</span>
                      <div className="flex items-center gap-1">
                        <Star className="text-amber-400 fill-amber-400" size={14} />
                        <span className="text-sm">{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <div>
            <div className="glass-card-elevated rounded-2xl p-6 sticky top-20">
              <p className="text-3xl font-bold text-foreground mb-1">
                ₹{hostel.price.toLocaleString()}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-sm text-muted-foreground mb-6">Includes meals & utilities</p>

              <Button
                className="w-full gradient-primary text-primary-foreground rounded-xl h-11 mb-3"
                onClick={() => { setBookingOpen(true); setBookingDone(false); }}
              >
                Book Now
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl h-11 gap-2"
                onClick={() => { setVisitOpen(true); setVisitDone(false); }}
              >
                <CalendarCheck size={16} /> Schedule Visit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Book {hostel.name}</DialogTitle>
          </DialogHeader>
          {bookingDone ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">Booking Request Sent!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The owner will review your request and contact you within 24 hours.
              </p>
              <Button className="w-full rounded-xl" onClick={() => setBookingOpen(false)}>Done</Button>
            </div>
          ) : (
            <form onSubmit={handleBooking} className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Move-in Date *</label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={moveInDate}
                  onChange={e => setMoveInDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Duration (months)</label>
                <Input
                  type="number"
                  defaultValue={6}
                  min={1}
                  max={24}
                  className="rounded-xl"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                />
              </div>
              <div className="bg-secondary rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span className="font-medium">₹{hostel.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security Deposit (2 months)</span>
                  <span className="font-medium">₹{(hostel.price * 2).toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total Due at Move-in</span>
                  <span>₹{(hostel.price * 3).toLocaleString()}</span>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground rounded-xl h-11"
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                    Sending Request...
                  </span>
                ) : "Confirm Booking Request"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Visit Dialog */}
      <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Visit</DialogTitle>
          </DialogHeader>
          {visitDone ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">Visit Scheduled!</h3>
              <p className="text-sm text-muted-foreground mb-1">{visitDate} at {visitTime}</p>
              <p className="text-sm text-muted-foreground mb-4">We'll confirm via call or SMS.</p>
              <Button className="w-full rounded-xl" onClick={() => setVisitOpen(false)}>Done</Button>
            </div>
          ) : (
            <form onSubmit={handleVisit} className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Your Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Enter your name"
                    className="pl-9 rounded-xl"
                    value={visitName}
                    onChange={e => setVisitName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-muted-foreground" size={16} />
                  <Input
                    placeholder="+91 XXXXX XXXXX"
                    className="pl-9 rounded-xl"
                    value={visitPhone}
                    onChange={e => setVisitPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Visit Date *</label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Select Time Slot *</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVisitTime(t)}
                      className={`text-xs px-2 py-2 rounded-xl border transition-all ${
                        visitTime === t
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <Clock size={12} className="inline mr-1" />{t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Notes (optional)</label>
                <Textarea
                  placeholder="Any special requests or questions..."
                  className="rounded-xl"
                  rows={2}
                  value={visitNotes}
                  onChange={e => setVisitNotes(e.target.value)}
                />
              </div>
              <div className="bg-secondary rounded-xl p-3 text-xs text-muted-foreground">
                Our team will confirm your visit within a few hours via call or SMS.
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground rounded-xl h-11"
                disabled={visitLoading || !visitDate || !visitTime}
              >
                {visitLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                    Scheduling...
                  </span>
                ) : "Confirm Visit"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostelDetail;
