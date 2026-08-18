import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, BankingProvider, RoleProvider } from "./contexts";
import { ProtectedRoute, AdminRoute, Layout } from "./components";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ContactPage from "./pages/ContactPage";
import AboutUsPage from "./pages/AboutUsPage";
import TermsPage from "./pages/TermsPage";
import { 
  LoginPage, 
  ForgotPasswordPage 
} from "./pages/auth";
import { 
  DashboardPage, 
  LoanApplicationPage, 
  LoanHistoryPage, 
  RepaymentPage, 
  ProfilePage 
} from "./pages/user";
import { 
  AdminDashboardPage,
  CustomersPage,
  ApplicationsPage,
  ReviewPage,
  DisbursementPage,
  SettingsPage,
  AccountsPage,
  TransactionsPage,
  GeneralLedgerPage,
  AuditPage,
  RolesPage,
  StaffPage,
  FeeManagementPage,
  InterestManagementPage,
  LoanProductsPage,
  ReportsPage
} from "./pages/admin";

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
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutUsPage />} />
                <Route path="/terms" element={<TermsPage />} />
                
                {/* Protected user routes - for customers only */}
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
                
                {/* Admin routes - for both admin AND staff users */}
                <Route path="/admin/dashboard" element={
                  <AdminRoute>
                    <Layout>
                      <AdminDashboardPage />
                    </Layout>
                  </AdminRoute>
                } />
                
                {/* Loan Operations */}
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
                
                {/* Customer Management */}
                <Route path="/admin/customers" element={
                  <AdminRoute>
                    <Layout>
                      <CustomersPage />
                    </Layout>
                  </AdminRoute>
                } />
               
                {/* Accounts */}
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
                
                {/* Financial Settings */}
                <Route path="/admin/interest-management" element={
                  <AdminRoute>
                    <Layout>
                      <InterestManagementPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/fee-management" element={
                  <AdminRoute>
                    <Layout>
                      <FeeManagementPage />
                    </Layout>
                  </AdminRoute>
                } />
               
                {/* Administration */}
                <Route path="/admin/staff" element={
                  <AdminRoute>
                    <Layout>
                      <StaffPage />
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
                <Route path="/admin/loan-products" element={
                  <AdminRoute>
                    <Layout>
                      <LoanProductsPage />
                    </Layout>
                  </AdminRoute>
                } />
                
                {/* Reports */}
                <Route path="/admin/audit" element={
                  <AdminRoute>
                    <Layout>
                      <AuditPage />
                    </Layout>
                  </AdminRoute>
                } />
                <Route path="/admin/reports" element={
  <AdminRoute>
    <Layout>
      <ReportsPage />
    </Layout>
  </AdminRoute>
} />
               
                {/* System */}
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