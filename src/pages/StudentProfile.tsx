import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { residentPortalApi, type Resident } from "@/lib/nexus";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    residentPortalApi.profile().then(p => { setResident(p.resident); setForm(p.resident || {}); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await residentPortalApi.updateProfile({
        phone: form.phone, dateOfBirth: form.dateOfBirth, gender: form.gender,
        emergencyName: form.emergencyName, emergencyPhone: form.emergencyPhone, emergencyRelation: form.emergencyRelation,
        occupation: form.occupation, institution: form.institution,
      });
      toast({ title: "Profile updated!" });
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-r-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 md:px-8 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/student")} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">My Profile</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-8">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {!resident ? (
              <p className="text-muted-foreground text-center py-8">Your profile hasn't been set up by your property manager yet.</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{resident.firstName?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{resident.firstName} {resident.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Phone</Label><Input value={form.phone || ""} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} className="rounded-xl" /></div>
                  <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth || ""} onChange={e => setForm((p: any) => ({ ...p, dateOfBirth: e.target.value }))} className="rounded-xl" /></div>
                  <div><Label>Gender</Label>
                    <Select value={form.gender || ""} onValueChange={v => setForm((p: any) => ({ ...p, gender: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Occupation</Label>
                    <Select value={form.occupation || ""} onValueChange={v => setForm((p: any) => ({ ...p, occupation: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="working_professional">Working Professional</SelectItem><SelectItem value="trainee">Trainee</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>Institution / Company</Label><Input value={form.institution || ""} onChange={e => setForm((p: any) => ({ ...p, institution: e.target.value }))} className="rounded-xl" /></div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-foreground mb-3">Emergency Contact</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Name</Label><Input value={form.emergencyName || ""} onChange={e => setForm((p: any) => ({ ...p, emergencyName: e.target.value }))} className="rounded-xl" /></div>
                    <div><Label>Phone</Label><Input value={form.emergencyPhone || ""} onChange={e => setForm((p: any) => ({ ...p, emergencyPhone: e.target.value }))} className="rounded-xl" /></div>
                    <div><Label>Relation</Label><Input value={form.emergencyRelation || ""} onChange={e => setForm((p: any) => ({ ...p, emergencyRelation: e.target.value }))} className="rounded-xl" /></div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={saving} className="rounded-xl gap-2"><Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
