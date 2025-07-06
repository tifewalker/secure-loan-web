
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BankingProvider } from "./contexts/BankingContext";
import { RoleProvider } from "./contexts/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import DashboardPage from "./pages/user/DashboardPage";
import LoanApplicationPage from "./pages/user/LoanApplicationPage";
import LoanHistoryPage from "./pages/user/LoanHistoryPage";
import RepaymentPage from "./pages/user/RepaymentPage";
import ProfilePage from "./pages/user/ProfilePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import CustomersPage from "./pages/admin/CustomersPage";
import ApplicationsPage from "./pages/admin/ApplicationsPage";
import ReviewPage from "./pages/admin/ReviewPage";
import DisbursementPage from "./pages/admin/DisbursementPage";
import SettingsPage from "./pages/admin/SettingsPage";
import AccountsPage from "./pages/admin/AccountsPage";
import TransactionsPage from "./pages/admin/TransactionsPage";
import GeneralLedgerPage from "./pages/admin/GeneralLedgerPage";
import AuditPage from "./pages/admin/AuditPage";
import RolesPage from "./pages/admin/RolesPage";
import ContactPage from "./pages/ContactPage";
import AboutUsPage from "./pages/AboutUsPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BankingProvider>
          <RoleProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutUsPage />} />
                <Route path="/terms" element={<TermsPage />} />
                
                {/* Protected user routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/apply" element={
                  <ProtectedRoute>
                    <Layout>
                      <LoanApplicationPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute>
                    <Layout>
                      <LoanHistoryPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/repayment" element={
                  <ProtectedRoute>
                    <Layout>
                      <RepaymentPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* Admin routes */}
                <Route path="/admin/dashboard" element={
                  <AdminRoute>
                    <Layout>
                      <AdminDashboardPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/customers" element={
                  <AdminRoute>
                    <Layout>
                      <CustomersPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/accounts" element={
                  <AdminRoute>
                    <Layout>
                      <AccountsPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/transactions" element={
                  <AdminRoute>
                    <Layout>
                      <TransactionsPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/general-ledger" element={
                  <AdminRoute>
                    <Layout>
                      <GeneralLedgerPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/applications" element={
                  <AdminRoute>
                    <Layout>
                      <ApplicationsPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/review" element={
                  <AdminRoute>
                    <Layout>
                      <ReviewPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/disbursement" element={
                  <AdminRoute>
                    <Layout>
                      <DisbursementPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/audit" element={
                  <AdminRoute>
                    <Layout>
                      <AuditPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/roles" element={
                  <AdminRoute>
                    <Layout>
                      <RolesPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/settings" element={
                  <AdminRoute>
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </AdminRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </RoleProvider>
        </BankingProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
