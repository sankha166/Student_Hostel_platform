import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import StudentDashboard from "./pages/StudentDashboard.tsx";
import HostelDetail from "./pages/HostelDetail.tsx";
import RentPage from "./pages/RentPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import OwnerMainDashboard from "./pages/OwnerMainDashboard.tsx";
import PropertyDashboard from "./pages/propertyDashboard.tsx";
import AddProperty from "./pages/AddProperty.tsx";
import OwnerProfile from "./pages/OwnerProfile.tsx";
import StudentProfile from "./pages/StudentProfile.tsx";
import FoodDelivery from "./pages/FoodDelivery.tsx";
import ResidentComplaints from "./pages/ResidentComplaints.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/food" element={<FoodDelivery />} />
            <Route path="/student" element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/hostel/:id" element={
              <ProtectedRoute requiredRole="student">
                <HostelDetail />
              </ProtectedRoute>
            } />
            <Route path="/student/rent" element={
              <ProtectedRoute requiredRole="student">
                <RentPage />
              </ProtectedRoute>
            } />
            <Route path="/student/profile" element={
              <ProtectedRoute requiredRole="student">
                <StudentProfile />
              </ProtectedRoute>
            } />
            <Route path="/student/complaints" element={
              <ProtectedRoute requiredRole="student">
                <ResidentComplaints />
              </ProtectedRoute>
            } />
            <Route path="/owner" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerMainDashboard />
              </ProtectedRoute>
            } />
            <Route path="/owner/property/:propertyId" element={
              <ProtectedRoute requiredRole="owner">
                <PropertyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/owner/add-property" element={
              <ProtectedRoute requiredRole="owner">
                <AddProperty />
              </ProtectedRoute>
            } />
            <Route path="/owner/profile" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerProfile />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
