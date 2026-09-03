import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, MapPin, Upload, Phone, Mail, IndianRupee,
  Plus, X, CheckCircle2, Image, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { propertyService } from "@/lib/dataService";

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];

const AMENITY_OPTIONS = [
  "Wi-Fi", "AC", "Laundry", "Study Room", "Gym", "Power Backup",
  "Parking", "Kitchen Access", "Meals", "Hot Water", "CCTV",
  "Gaming Room", "Rooftop", "Library", "Co-working Space", "Swimming Pool"
];

const AddProperty = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    maleOrFemaleOrQuadruple: "male" as "male" | "female" | "quadruple",
    type: "hostel" as "hostel" | "pg" | "apartment",
    address: "",
    city: "",
    state: "",
    pincode: "",
    description: "",
    totalRooms: "",
    monthlyRentFrom: "",
    monthlyRentTo: "",
    contactPhone: "",
    contactEmail: "",
    amenities: [] as string[],
  });
    // --- MAP STATES ---
  const [markerPosition, setMarkerPosition] = useState({ lat: 12.9716, lng: 77.5946 });
  const [address, setAddress] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries
  });

  // --- MAP HANDLERS ---
  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  const [images, setImages] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleAmenity = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Persist property using dataService
    propertyService.create({
      name: form.name,
      type: form.type,
      location: `${form.city}, ${form.state}`,
      address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
      totalRooms: parseInt(form.totalRooms) || 0,
      occupiedRooms: 0,
      totalBeds: parseInt(form.totalRooms) || 0,
      occupiedBeds: 0,
      monthlyRent: parseInt(form.monthlyRentFrom) || 0,
      totalRevenue: 0,
      dueAmount: 0,
      image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop",
      rating: 0,
      lat: markerPosition.lat,
      lng: markerPosition.lng,
      amenities: form.amenities,
      contactPhone: form.contactPhone,
      contactEmail: form.contactEmail,
    });
    setSubmitted(true);
    setTimeout(() => navigate("/owner"), 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Property Added!</h2>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Add New Property</h1>
            <p className="text-sm text-muted-foreground">Fill in the details to list your property</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Property Name *</label>
                <Input
                  placeholder="e.g. Sunrise Student Haven"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Property Type *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as typeof form.type }))}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="hostel">Hostel</option>
                  <option value="pg">PG (Paying Guest)</option>
                  <option value="apartment">Apartment</option>
                </select>
                <label className="text-sm font-medium text-foreground">Accomodation For *</label>
                <select
                  value={form.maleOrFemaleOrQuadruple}
                  onChange={e => setForm(p => ({ ...p, maleOrFemaleOrQuadruple: e.target.value as typeof form.maleOrFemaleOrQuadruple }))}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="quadruple">Quadruple</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Total Rooms *</label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 20"
                  value={form.totalRooms}
                  onChange={e => setForm(p => ({ ...p, totalRooms: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rent Range From (₹) *</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 3000"
                  value={form.monthlyRentFrom}
                  onChange={e => setForm(p => ({ ...p, monthlyRentFrom: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rent Range To (₹) *</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 7000"
                  value={form.monthlyRentTo}
                  onChange={e => setForm(p => ({ ...p, monthlyRentTo: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  placeholder="Describe your property - features, nearby landmarks, what makes it special..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
            <div>
                              <label className="text-sm font-medium text-foreground mb-1 block">Location</label>
                              <div className="relative mb-3">
                                <Input 
                                  placeholder="Search or drag pin on map" 
                                  className="rounded-xl pl-10" 
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                />
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                              </div>
                              
                              {/* Google Map Implementation */}
                              <div className="rounded-xl overflow-hidden border border-border h-[300px] relative">
                                {isLoaded ? (
                                  <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={markerPosition}
                                    zoom={15}
                                    onClick={onMapClick}
                                    options={{
                                      disableDefaultUI: true,
                                      zoomControl: true,
                                    }}
                                  >
                                    <Marker 
                                      position={markerPosition} 
                                      draggable={true}
                                      onDragEnd={(e) => {
                                        if(e.latLng) setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                                      }}
                                    />
                                  </GoogleMap>
                                ) : (
                                  <div className="w-full h-full bg-secondary animate-pulse flex items-center justify-center text-muted-foreground">
                                    Loading Map...
                                  </div>
                                )}
                                <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur px-3 py-1.5 rounded-lg border border-border text-[10px] text-muted-foreground">
                                  Lat: {markerPosition.lat.toFixed(4)}, Lng: {markerPosition.lng.toFixed(4)}
                                </div>
                              </div>
                            </div>
            </CardHeader>
            
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Full Address *</label>
                <Textarea
                  placeholder="Street address, area, landmark..."
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  required
                  rows={2}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City *</label>
                <Input
                  placeholder="e.g. Bangalore"
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">State *</label>
                <Input
                  placeholder="e.g. Karnataka"
                  value={form.state}
                  onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pincode *</label>
                <Input
                  placeholder="e.g. 560034"
                  value={form.pincode}
                  onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))}
                  required
                  maxLength={6}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Contact Phone *</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.contactPhone}
                  onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Contact Email *</label>
                <Input
                  type="email"
                  placeholder="property@email.com"
                  value={form.contactEmail}
                  onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))}
                  required
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" /> Amenities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map(amenity => (
                  <Badge
                    key={amenity}
                    variant={form.amenities.includes(amenity) ? "default" : "outline"}
                    className="cursor-pointer text-sm px-3 py-1.5 transition-all"
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {form.amenities.includes(amenity) && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {amenity}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" /> Property Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">Click to upload images</p>
                <p className="text-sm text-muted-foreground mt-1">JPG, PNG (Max 5MB each, up to 10 images)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              {images.length > 0 && (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Upload ${i + 1}`}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate("/owner")} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl gap-2 px-8">
              <Plus className="w-4 h-4" /> Add Property
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;
