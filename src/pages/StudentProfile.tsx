import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, Phone, Mail, MapPin, Calendar, Shield, Heart, BookOpen,
  Camera, Save, ArrowLeft, GraduationCap, FileText,
  AlertCircle, CheckCircle2, Upload, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface StudentProfileData {
  // Personal
  fullName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  nationality: string;
  religion: string;
  profileImage: string;
  // Address
  permanentAddress: string;
  city: string;
  state: string;
  pincode: string;
  // Education
  collegeName: string;
  course: string;
  year: string;
  collegeId: string;
  // Guardian / Parent
  fatherName: string;
  fatherPhone: string;
  fatherOccupation: string;
  motherName: string;
  motherPhone: string;
  motherOccupation: string;
  localGuardianName: string;
  localGuardianPhone: string;
  localGuardianAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  // Identity
  aadharNo: string;
  panNo: string;
  passportNo: string;
  // Medical
  medicalConditions: string;
  allergies: string;
  // Preferences
  foodPreference: string;
  hobbies: string;
}

const defaultProfile: StudentProfileData = {
  fullName: "", email: "", phone: "", alternatePhone: "", dateOfBirth: "", gender: "",
  bloodGroup: "", nationality: "Indian", religion: "", profileImage: "",
  permanentAddress: "", city: "", state: "", pincode: "",
  collegeName: "", course: "", year: "", collegeId: "",
  fatherName: "", fatherPhone: "", fatherOccupation: "",
  motherName: "", motherPhone: "", motherOccupation: "",
  localGuardianName: "", localGuardianPhone: "", localGuardianAddress: "",
  emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "",
  aadharNo: "", panNo: "", passportNo: "",
  medicalConditions: "", allergies: "",
  foodPreference: "Veg", hobbies: "",
};

type Section = "personal" | "address" | "education" | "guardian" | "identity" | "medical" | "My Food";

const StudentProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  // Load saved profile from localStorage or initialize from auth user
  const [profile, setProfile] = useState<StudentProfileData>(() => {
    try {
      const saved = localStorage.getItem("studentProfile");
      if (saved) return { ...defaultProfile, ...JSON.parse(saved) };
    } catch {}
    return {
      ...defaultProfile,
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    };
  });
  const [activeSection, setActiveSection] = useState<Section>("personal");
  const [saved, setSaved] = useState(false);
  const [searchImage, setIdImage] = useState<File | null>(null);

  const update = (field: keyof StudentProfileData, value: string) => {
    setProfile(p => ({ ...p, [field]: value }));
    setSaved(false);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setIdImage(e.target.files[0]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("studentProfile", JSON.stringify(profile));
    // Sync name/email to auth context if changed
    if (profile.fullName || profile.email) {
      updateUser({ name: profile.fullName, email: profile.email, phone: profile.phone });
    }
    setSaved(true);
    toast({ title: "Profile saved!", description: "Your profile has been updated successfully." });
    setTimeout(() => setSaved(false), 3000);
  };

  const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "personal", label: "Personal Details", icon: User },
    { id: "address", label: "Address", icon: MapPin },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "guardian", label: "Guardian & Emergency", icon: Users },
    { id: "identity", label: "Identity Documents", icon: Shield },
    { id: "medical", label: "Medical & Preferences", icon: Heart },
  ];

  const fieldClass = "rounded-xl";
  const labelClass = "text-sm font-medium text-foreground";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card shrink-0">
        <div className="p-6 border-b">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl text-foreground">
            <img src="/iconn.png" alt="HostelAI Logo" className="w-12 h-12 object-contain" />
            Residential Nexus
          </button>
        </div>
        <div className="p-6 border-b">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3 relative">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
              
            ) : (
              <User className="w-10 h-10 text-primary" />
              
            )}
            
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-center font-semibold text-foreground text-sm">{profile.fullName || "Student Name"}</p>
          <p className="text-center text-xs text-muted-foreground">{profile.email || "email@example.com"}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === s.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-card px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl lg:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Student Profile</h1>
              <p className="text-xs text-muted-foreground">Complete your profile to book hostels</p>
            </div>
          </div>
          {saved && (
            <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1" variant="outline">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </Badge>
          )}
        </header>

        {/* Mobile Section Nav */}
        <div className="flex lg:hidden gap-2 overflow-x-auto p-4 pb-2">
          {sections.map(s => (
            <Button
              key={s.id}
              variant={activeSection === s.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection(s.id)}
              className="rounded-xl gap-1 shrink-0 text-xs"
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </Button>
          ))}
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <form onSubmit={handleSave}>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl space-y-6"
            >
              {/* Personal Details */}
              {activeSection === "personal" && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" /> Personal Information
                    </CardTitle>
                    <CardDescription>Basic personal details required for hostel booking</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={labelClass}>Full Name *</label>
                        <Input placeholder="Enter full name" value={profile.fullName} onChange={e => update("fullName", e.target.value)} required className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Email Address *</label>
                        <Input type="email" placeholder="student@email.com" value={profile.email} onChange={e => update("email", e.target.value)} required className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Phone Number *</label>
                        <Input placeholder="+91 XXXXX XXXXX" value={profile.phone} onChange={e => update("phone", e.target.value)} required className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Alternate Phone</label>
                        <Input placeholder="+91 XXXXX XXXXX" value={profile.alternatePhone} onChange={e => update("alternatePhone", e.target.value)} className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Date of Birth *</label>
                        <Input type="date" value={profile.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} required className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Gender *</label>
                        <select value={profile.gender} onChange={e => update("gender", e.target.value)} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm" required>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Blood Group *</label>
                        <select value={profile.bloodGroup} onChange={e => update("bloodGroup", e.target.value)} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm" required>
                          <option value="">Select</option>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Nationality</label>
                        <Input value={profile.nationality} onChange={e => update("nationality", e.target.value)} className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Religion</label>
                        <Input placeholder="Enter religion" value={profile.religion} onChange={e => update("religion", e.target.value)} className={fieldClass} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Address */}
              {activeSection === "address" && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" /> Permanent Address
                    </CardTitle>
                    <CardDescription>Your home address for records and communication</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className={labelClass}>Full Address *</label>
                      <Textarea placeholder="House No., Street, Locality..." value={profile.permanentAddress} onChange={e => update("permanentAddress", e.target.value)} required className={fieldClass} rows={3} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className={labelClass}>City *</label>
                        <Input placeholder="Enter city" value={profile.city} onChange={e => update("city", e.target.value)} required className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>State *</label>
                        <Input placeholder="Enter state" value={profile.state} onChange={e => update("state", e.target.value)} required className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>PIN Code *</label>
                        <Input placeholder="6-digit PIN" maxLength={6} value={profile.pincode} onChange={e => update("pincode", e.target.value)} required className={fieldClass} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {activeSection === "education" && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-primary" /> Education Details
                    </CardTitle>
                    <CardDescription>Your college/university information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <label className={labelClass}>College / University Name *</label>
                        <Input placeholder="Enter college name" value={profile.collegeName} onChange={e => update("collegeName", e.target.value)} required className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Course / Degree *</label>
                        <Input placeholder="e.g. B.Tech CSE" value={profile.course} onChange={e => update("course", e.target.value)} required className={fieldClass} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Year / Semester *</label>
                        <select value={profile.year} onChange={e => update("year", e.target.value)} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm" required>
                          <option value="">Select</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="5th Year">5th Year</option>
                          <option value="PG 1st Year">PG 1st Year</option>
                          <option value="PG 2nd Year">PG 2nd Year</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>College ID Number</label>
                        <Input placeholder="Student ID / Roll No." value={profile.collegeId} onChange={e => update("collegeId", e.target.value)} className={fieldClass} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Guardian & Emergency */}
              {activeSection === "guardian" && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" /> Parent / Guardian Details
                      </CardTitle>
                      <CardDescription>Required for hostel admission records</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Father</Badge>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className={labelClass}>Father's Name *</label>
                            <Input placeholder="Full name" value={profile.fatherName} onChange={e => update("fatherName", e.target.value)} required className={fieldClass} />
                          </div>
                          <div className="space-y-2">
                            <label className={labelClass}>Father's Phone *</label>
                            <Input placeholder="+91 XXXXX XXXXX" value={profile.fatherPhone} onChange={e => update("fatherPhone", e.target.value)} required className={fieldClass} />
                          </div>
                          <div className="space-y-2">
                            <label className={labelClass}>Father's Occupation</label>
                            <Input placeholder="Occupation" value={profile.fatherOccupation} onChange={e => update("fatherOccupation", e.target.value)} className={fieldClass} />
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Mother</Badge>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className={labelClass}>Mother's Name *</label>
                            <Input placeholder="Full name" value={profile.motherName} onChange={e => update("motherName", e.target.value)} required className={fieldClass} />
                          </div>
                          <div className="space-y-2">
                            <label className={labelClass}>Mother's Phone</label>
                            <Input placeholder="+91 XXXXX XXXXX" value={profile.motherPhone} onChange={e => update("motherPhone", e.target.value)} className={fieldClass} />
                          </div>
                          <div className="space-y-2">
                            <label className={labelClass}>Mother's Occupation</label>
                            <Input placeholder="Occupation" value={profile.motherOccupation} onChange={e => update("motherOccupation", e.target.value)} className={fieldClass} />
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Local Guardian</Badge>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={labelClass}>Local Guardian Name</label>
                            <Input placeholder="Full name" value={profile.localGuardianName} onChange={e => update("localGuardianName", e.target.value)} className={fieldClass} />
                          </div>
                          <div className="space-y-2">
                            <label className={labelClass}>Local Guardian Phone</label>
                            <Input placeholder="+91 XXXXX XXXXX" value={profile.localGuardianPhone} onChange={e => update("localGuardianPhone", e.target.value)} className={fieldClass} />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className={labelClass}>Local Guardian Address</label>
                            <Textarea placeholder="Full address" value={profile.localGuardianAddress} onChange={e => update("localGuardianAddress", e.target.value)} className={fieldClass} rows={2} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive" /> Emergency Contact
                      </CardTitle>
                      <CardDescription>Someone to contact in case of emergency</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className={labelClass}>Contact Name *</label>
                          <Input placeholder="Full name" value={profile.emergencyContactName} onChange={e => update("emergencyContactName", e.target.value)} required className={fieldClass} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Contact Phone *</label>
                          <Input placeholder="+91 XXXXX XXXXX" value={profile.emergencyContactPhone} onChange={e => update("emergencyContactPhone", e.target.value)} required className={fieldClass} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Relationship *</label>
                          <select value={profile.emergencyContactRelation} onChange={e => update("emergencyContactRelation", e.target.value)} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm" required>
                            <option value="">Select</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Uncle">Uncle</option>
                            <option value="Aunt">Aunt</option>
                            <option value="Guardian">Guardian</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Identity Documents */}
              {activeSection === "identity" && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" /> Identity Documents
                    </CardTitle>
                    <CardDescription>Government-issued ID for verification (at least Aadhaar is mandatory)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={labelClass}>Aadhaar Number *</label>
                        <Input placeholder="XXXX XXXX XXXX" maxLength={14} value={profile.aadharNo} onChange={e => update("aadharNo", e.target.value)} required className={fieldClass} />
                        <p className="text-xs text-muted-foreground">12-digit Aadhaar number</p>
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>PAN Number</label>
                        <Input placeholder="ABCDE1234F" maxLength={10} value={profile.panNo} onChange={e => update("panNo", e.target.value.toUpperCase())} className={fieldClass} />
                        <p className="text-xs text-muted-foreground">10-character PAN (optional)</p>
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Passport Number</label>
                        <Input placeholder="A1234567" value={profile.passportNo} onChange={e => update("passportNo", e.target.value.toUpperCase())} className={fieldClass} />
                        <p className="text-xs text-muted-foreground">Optional — for international students</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3">Upload Documents</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {["Aadhaar Card", "College ID", "Photo"].map(doc => (
                          <div key={doc} className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">{doc}</p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, JPG or PNG (max 2MB)</p>
                          </div>
                          
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Medical & Preferences */}
              {activeSection === "medical" && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" /> Medical & Preferences
                    </CardTitle>
                    <CardDescription>Health info and lifestyle preferences for your stay</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={labelClass}>Medical Conditions</label>
                        <Textarea placeholder="Any chronic diseases, disabilities, or conditions..." value={profile.medicalConditions} onChange={e => update("medicalConditions", e.target.value)} className={fieldClass} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Allergies</label>
                        <Textarea placeholder="Food, medicine, or environmental allergies..." value={profile.allergies} onChange={e => update("allergies", e.target.value)} className={fieldClass} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Food Preference *</label>
                        <select value={profile.foodPreference} onChange={e => update("foodPreference", e.target.value)} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm" required>
                          <option value="Veg">Vegetarian</option>
                          <option value="Non-Veg">Non-Vegetarian</option>
                          <option value="Vegan">Vegan</option>
                          <option value="Jain">Jain</option>
                          <option value="Eggetarian">Eggetarian</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Hobbies / Interests</label>
                        <Input placeholder="Reading, Sports, Music..." value={profile.hobbies} onChange={e => update("hobbies", e.target.value)} className={fieldClass} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Save Button */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Fields marked with * are mandatory
                </p>
                <div className="flex gap-3">
                  {activeSection !== "personal" && (
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => {
                      const idx = sections.findIndex(s => s.id === activeSection);
                      if (idx > 0) setActiveSection(sections[idx - 1].id);
                    }}>
                      Previous
                    </Button>
                  )}
                  {activeSection !== "medical" ? (
                    <Button type="button" className="rounded-xl gap-2" onClick={() => {
                      const idx = sections.findIndex(s => s.id === activeSection);
                      if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id);
                    }}>
                      Next <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Button>
                  ) : (
                    <Button type="submit" className="rounded-xl gap-2">
                      <Save className="w-4 h-4" /> Save Profile
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;