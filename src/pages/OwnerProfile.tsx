import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Mail, Phone, MapPin,
  Save, Edit2, Camera, Shield, Briefcase, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { profileService, propertyService } from "@/lib/dataService";
import { ownerProfile as defaultOwnerProfile } from "@/data/ownerData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const OwnerProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Load saved profile from persistent storage
  const [profile, setProfile] = useState(() => {
    const saved = profileService.getOwnerProfile();
    if (saved) return { ...defaultOwnerProfile, ...saved };
    return {
      ...defaultOwnerProfile,
      fullName: user?.name || defaultOwnerProfile.fullName,
      email: user?.email || defaultOwnerProfile.email,
      phone: user?.phone || defaultOwnerProfile.phone,
    };
  });

  const ownerProperties = useMemo(() => propertyService.getAll(), []);
  const totalRevenue = ownerProperties.reduce((s, p) => s + p.totalRevenue, 0);
  const totalTenants = ownerProperties.reduce((s, p) => s + p.occupiedBeds, 0);

  const handleSave = () => {
    profileService.updateOwnerProfile(profile);
    updateUser({ name: profile.fullName, email: profile.email, phone: profile.phone });
    setIsEditing(false);
    toast({ title: "Profile saved!", description: "Your profile has been updated successfully." });
  };

  const initials = profile.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Owner Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your personal & business details</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl gap-2">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSave} className="rounded-xl gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-primary/20 to-primary/5" />
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{profile.fullName}</h2>
                <p className="text-muted-foreground text-sm">{profile.businessName}</p>
              </div>
              <div className="flex gap-4 sm:gap-6 text-center">
                <div>
                  <p className="text-xl font-bold text-foreground">{ownerProperties.length}</p>
                  <p className="text-xs text-muted-foreground">Properties</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totalTenants}</p>
                  <p className="text-xs text-muted-foreground">Tenants</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">₹{(totalRevenue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Full Name", key: "fullName", type: "text" },
              { label: "Email", key: "email", type: "email" },
              { label: "Phone", key: "phone", type: "tel" },
              { label: "Alternate Phone", key: "alternatePhone", type: "tel" },
            ].map(({ label, key, type }) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <Input
                  type={type}
                  value={(profile as any)[key] || ""}
                  onChange={e => setProfile((p: any) => ({ ...p, [key]: e.target.value }))}
                  disabled={!isEditing}
                  className="rounded-xl disabled:opacity-70"
                />
              </div>
            ))}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground">Address</label>
              <Input
                value={profile.address || ""}
                onChange={e => setProfile((p: any) => ({ ...p, address: e.target.value }))}
                disabled={!isEditing}
                className="rounded-xl disabled:opacity-70"
              />
            </div>
            {[
              { label: "City", key: "city" },
              { label: "State", key: "state" },
              { label: "Pincode", key: "pincode" },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <Input
                  value={(profile as any)[key] || ""}
                  onChange={e => setProfile((p: any) => ({ ...p, [key]: e.target.value }))}
                  disabled={!isEditing}
                  className="rounded-xl disabled:opacity-70"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Identity & Documents */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Identity & Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Aadhaar Number", key: "aadharNo" },
              { label: "PAN Number", key: "panNo" },
              { label: "GST Number (optional)", key: "gstNo" },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <Input
                  value={(profile as any)[key] || ""}
                  onChange={e => setProfile((p: any) => ({ ...p, [key]: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Optional"
                  className="rounded-xl disabled:opacity-70"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Business Name", key: "businessName" },
              { label: "Business Type", key: "businessType" },
              { label: "Years in Business", key: "yearsInBusiness", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <Input
                  type={type || "text"}
                  value={(profile as any)[key] || ""}
                  onChange={e => setProfile((p: any) => ({ ...p, [key]: e.target.value }))}
                  disabled={!isEditing}
                  className="rounded-xl disabled:opacity-70"
                />
              </div>
            ))}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <Textarea
                value={profile.bio || ""}
                onChange={e => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
                disabled={!isEditing}
                rows={3}
                placeholder="Tell about yourself and your business..."
                className="rounded-xl disabled:opacity-70"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom save button */}
        {isEditing && (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl gap-2">
              <CheckCircle2 className="w-4 h-4" /> Save All Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerProfile;
