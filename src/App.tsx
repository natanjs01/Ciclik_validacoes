import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/UserDashboard";
import Missions from "./pages/Missions";
import MissionStudy from "./pages/MissionStudy";
import MissionQuiz from "./pages/MissionQuiz";
import MissionContent from "./pages/MissionContent";
import UploadReceipt from "./pages/UploadReceipt";
import DeliverRecyclables from "./pages/DeliverRecyclables";
import DeliveryHistory from "./pages/DeliveryHistory";
import MaterialsHistoryPage from "./pages/MaterialsHistoryPage";
import Coupons from "./pages/Coupons";
import Profile from "./pages/Profile";
import CooperativeDashboard from "./pages/CooperativeDashboard";
import CooperativeScanQRCode from "./pages/CooperativeScanQRCode";
import CooperativeRegisterMaterials from "./pages/CooperativeRegisterMaterials";
import CooperativeTriagem from "./pages/CooperativeTriagem";
import ValidateDelivery from "./pages/ValidateDelivery";
import CooperativeDeliveries from "./pages/CooperativeDeliveries";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMissions from "./pages/AdminMissions";
import AdminMissionEdit from "./pages/AdminMissionEdit";
import AdminCoupons from "./pages/AdminCoupons";
import AdminOperadoresLogisticos from "./pages/AdminOperadoresLogisticos";
import AdminCompanies from "./pages/AdminCompanies";
import CompanyMetricsDashboard from "./pages/CompanyMetricsDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompanyOwnMetrics from "./pages/CompanyOwnMetrics";
import AdminUsers from "./pages/AdminUsers";
import AdminKPIs from "./pages/AdminKPIs";
import AdminDocumentation from "./pages/AdminDocumentation";
import GerenciarTermosPage from "./pages/admin/GerenciarTermosPage";
import FormularioTermoPage from "./pages/admin/FormularioTermoPage";
import DetalhesTermoPage from "./pages/admin/DetalhesTermoPage";
import RelatorioAceitesPage from "./pages/admin/RelatorioAceitesPage";
import TermosPendentesPage from "./pages/TermosPendentesPage";
import AdminProducts from "./pages/AdminProducts";
import AdminProductsReport from "./pages/AdminProductsReport";
import AdminProductsAnalysis from "./pages/AdminProductsAnalysis";
import AdminSettings from "./pages/AdminSettings";
import AdminGamification from "./pages/AdminGamification";
import AdminPointsAudit from "./pages/AdminPointsAudit";
import RedeemCoupons from "./pages/RedeemCoupons";
import SelectMaterialsForDelivery from "./pages/SelectMaterialsForDelivery";
import AdminDeliveryPromises from "./pages/AdminDeliveryPromises";
import PointsStatement from "./pages/PointsStatement";
import Goals from "./pages/Goals";
import CDVLanding from "./pages/CDVLanding";
import CDVLandingInvestor from "./pages/CDVLandingInvestor";
import CDVInvestorDashboard from "./pages/CDVInvestorDashboard";
import CDVCertificate from "./pages/CDVCertificate";
import CDVCertificatePreview from "./pages/CDVCertificatePreview";
import CDVValidate from "./pages/CDVValidate";
import AdminCDV from "./pages/AdminCDV";
import AdminRotasColeta from "./pages/AdminRotasColeta";
import AdminInteresses from "./pages/AdminInteresses";
import InstitutionalPresentation from "./pages/InstitutionalPresentation";
import InvestorPresentation from "./pages/InvestorPresentation";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";
import SupabaseTest from "./pages/SupabaseTest";
import EmailConfirm from "./pages/EmailConfirm";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// RoleBasedRedirect moved to separate component to ensure it's used within AuthProvider
function RoleBasedRedirect() {
  const { userRole, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Se não está autenticado, mostrar página institucional
  if (!user) return <InstitutionalPresentation />;

  // NÃO redirecionar se está na página de termos pendentes
  if (location.pathname === '/termos-pendentes') {
    return null;
  }

  // Se está autenticado, redirecionar para o dashboard apropriado
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  if (userRole === 'cooperativa') return <Navigate to="/cooperative" replace />;
  if (userRole === 'empresa') return <Navigate to="/company" replace />;
  if (userRole === 'investidor') return <Navigate to="/cdv/investor" replace />;
  if (userRole === 'vendedor' || userRole === 'usuario') return <Navigate to="/user" replace />;
  
  // Se está autenticado mas não tem role, redireciona para auth
  return <Navigate to="/auth" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/confirm" element={<EmailConfirm />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/institucional" element={<InstitutionalPresentation />} />
      
      {/* User Routes */}
      <Route path="/user" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><UserDashboard /></ProtectedRoute>} />
      <Route path="/missions" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><Missions /></ProtectedRoute>} />
      <Route path="/mission/content/:id" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><MissionContent /></ProtectedRoute>} />
      <Route path="/mission/study/:id" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><MissionStudy /></ProtectedRoute>} />
      <Route path="/mission/quiz/:id" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><MissionQuiz /></ProtectedRoute>} />
      <Route path="/upload-receipt" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><UploadReceipt /></ProtectedRoute>} />
      <Route path="/select-materials" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><SelectMaterialsForDelivery /></ProtectedRoute>} />
      <Route path="/deliver-recyclables" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><DeliverRecyclables /></ProtectedRoute>} />
      <Route path="/delivery-history" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><DeliveryHistory /></ProtectedRoute>} />
      <Route path="/materials-history" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><MaterialsHistoryPage /></ProtectedRoute>} />
      <Route path="/coupons" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><Coupons /></ProtectedRoute>} />
      <Route path="/redeem-coupons" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><RedeemCoupons /></ProtectedRoute>} />
      <Route path="/points-statement" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><PointsStatement /></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><Goals /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor']}><Profile /></ProtectedRoute>} />
      
      {/* Termos de Uso Route - Available for all authenticated users - SKIP TERMOS CHECK */}
      <Route 
        path="/termos-pendentes" 
        element={
          <ProtectedRoute 
            allowedRoles={['admin', 'usuario', 'vendedor', 'cooperativa', 'investidor']}
            skipTermosCheck={true}
          >
            <TermosPendentesPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Notifications Route - Available for all authenticated users */}
      <Route path="/notifications" element={<ProtectedRoute allowedRoles={['usuario', 'vendedor', 'cooperativa', 'empresa', 'admin', 'investidor']}><NotificationsPage /></ProtectedRoute>} />
      
      {/* Cooperative Routes */}
      <Route path="/cooperative" element={<ProtectedRoute allowedRoles={['cooperativa']}><CooperativeDashboard /></ProtectedRoute>} />
      <Route path="/cooperative/scan-qrcode" element={<ProtectedRoute allowedRoles={['cooperativa']}><CooperativeScanQRCode /></ProtectedRoute>} />
      <Route path="/cooperative/register-materials/:entregaId" element={<ProtectedRoute allowedRoles={['cooperativa']}><CooperativeRegisterMaterials /></ProtectedRoute>} />
      <Route path="/cooperative/triagem/:entregaId" element={<ProtectedRoute allowedRoles={['cooperativa']}><CooperativeTriagem /></ProtectedRoute>} />
      <Route path="/cooperative/validate" element={<ProtectedRoute allowedRoles={['cooperativa']}><ValidateDelivery /></ProtectedRoute>} />
      <Route path="/cooperative/deliveries" element={<ProtectedRoute allowedRoles={['cooperativa']}><CooperativeDeliveries /></ProtectedRoute>} />
      
      {/* Company Routes */}
      <Route path="/company" element={<ProtectedRoute allowedRoles={['empresa']}><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/company/metrics" element={<ProtectedRoute allowedRoles={['empresa']}><CompanyOwnMetrics /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/missions" element={<ProtectedRoute allowedRoles={['admin']}><AdminMissions /></ProtectedRoute>} />
        <Route path="/admin/missions/edit/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminMissionEdit /></ProtectedRoute>} />
        <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={['admin']}><AdminCoupons /></ProtectedRoute>} />
      <Route path="/admin/operadores-logisticos" element={<ProtectedRoute allowedRoles={['admin']}><AdminOperadoresLogisticos /></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['admin']}><AdminCompanies /></ProtectedRoute>} />
      <Route path="/admin/companies/:id/metrics" element={<ProtectedRoute allowedRoles={['admin']}><CompanyMetricsDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/kpis" element={<ProtectedRoute allowedRoles={['admin']}><AdminKPIs /></ProtectedRoute>} />
      <Route path="/admin/documentation" element={<ProtectedRoute allowedRoles={['admin']}><AdminDocumentation /></ProtectedRoute>} />
      <Route path="/admin/termos" element={<ProtectedRoute allowedRoles={['admin']}><GerenciarTermosPage /></ProtectedRoute>} />
      <Route path="/admin/termos/novo" element={<ProtectedRoute allowedRoles={['admin']}><FormularioTermoPage /></ProtectedRoute>} />
      <Route path="/admin/termos/:id" element={<ProtectedRoute allowedRoles={['admin']}><DetalhesTermoPage /></ProtectedRoute>} />
      <Route path="/admin/termos/:id/editar" element={<ProtectedRoute allowedRoles={['admin']}><FormularioTermoPage /></ProtectedRoute>} />
      <Route path="/admin/termos/:id/relatorio" element={<ProtectedRoute allowedRoles={['admin']}><RelatorioAceitesPage /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><AdminProducts /></ProtectedRoute>} />
      <Route path="/admin/products/report" element={<ProtectedRoute allowedRoles={['admin']}><AdminProductsReport /></ProtectedRoute>} />
      <Route path="/admin/products/analysis" element={<ProtectedRoute allowedRoles={['admin']}><AdminProductsAnalysis /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/gamification" element={<ProtectedRoute allowedRoles={['admin']}><AdminGamification /></ProtectedRoute>} />
      <Route path="/admin/points-audit" element={<ProtectedRoute allowedRoles={['admin']}><AdminPointsAudit /></ProtectedRoute>} />
      <Route path="/admin/delivery-promises" element={<ProtectedRoute allowedRoles={['admin']}><AdminDeliveryPromises /></ProtectedRoute>} />
      <Route path="/admin/cdv" element={<ProtectedRoute allowedRoles={['admin']}><AdminCDV /></ProtectedRoute>} />
      <Route path="/admin/rotas" element={<ProtectedRoute allowedRoles={['admin']}><AdminRotasColeta /></ProtectedRoute>} />
      <Route path="/admin/interesses" element={<ProtectedRoute allowedRoles={['admin']}><AdminInteresses /></ProtectedRoute>} />
      
      {/* CDV Routes */}
      <Route path="/cdv" element={<CDVLanding />} />
      <Route path="/investidor" element={<CDVLandingInvestor />} />
      <Route path="/cdv-investidor" element={<CDVLandingInvestor />} />
      <Route path="/apresentacao" element={<InstitutionalPresentation />} />
      <Route path="/apresentacao-investidor" element={<InvestorPresentation />} />
      <Route path="/cdv/investor" element={<ProtectedRoute allowedRoles={['investidor']}><CDVInvestorDashboard /></ProtectedRoute>} />
      <Route path="/cdv/certificate/:id" element={<ProtectedRoute allowedRoles={['investidor']}><CDVCertificate /></ProtectedRoute>} />
      <Route path="/preview-certificado" element={<CDVCertificatePreview />} />
      <Route path="/cdv/validate/:id" element={<CDVValidate />} />
      
      {/* Test Routes */}
      <Route path="/test/supabase" element={<SupabaseTest />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <BrowserRouter 
        basename={import.meta.env.MODE === 'production' ? '/Ciclik_validacoes' : '/'}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
