import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/hostel/:id" element={<HostelDetail />} />
          <Route path="/student/rent" element={<RentPage />} />
          <Route path="/owner" element={<OwnerMainDashboard />} />
          <Route path="/owner/property/:propertyId" element={<PropertyDashboard />} />
          <Route path="/owner/add-property" element={<AddProperty />} />
          <Route path="/owner/profile" element={<OwnerProfile />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/food" element={<FoodDelivery />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
