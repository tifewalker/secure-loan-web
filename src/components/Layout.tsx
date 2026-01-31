// src/components/Layout.tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDirectPermissions } from '@/hooks/useDirectPermissions';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  FileText, 
  Clock, 
  CreditCard, 
  User, 
  Settings, 
  Users, 
  BookOpen, 
  DollarSign,
  Menu,
  X,
  LogOut,
  Banknote,
  ArrowRightLeft,
  Shield,
  UserCheck,
  UserPlus,
  ChevronDown,
  CheckCircle,
  Percent,
  CreditCard as FeeIcon,
  BarChart3,
  ShieldCheck,
  Wallet,
  Lock,
  PieChart,
  Activity,
  FileBarChart,
  TrendingUp,
  FileCheck,
  Receipt
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavItem[];
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const { user, logout } = useAuth();
  const { 
    hasPermission, 
    isAdmin, 
    isStaff,
    roleName,
  } = useDirectPermissions();
  const location = useLocation();
  const navigate = useNavigate();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading user...</span>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const isMenuActive = (items: NavItem[]): boolean => {
    return items.some(item => {
      if (item.href === location.pathname) return true;
      if (item.children) return isMenuActive(item.children);
      return false;
    });
  };

  // Check if user has permission to see a nav item
  const hasNavPermission = (item: NavItem): boolean => {
    if (!item.permission) return true;
    if (isAdmin) return true;
    return hasPermission(item.permission);
  };

  // Check if user has permission to see any child in a nav group
  const hasAnyChildPermission = (item: NavItem): boolean => {
    if (!item.children || item.children.length === 0) return true;
    return item.children.some(child => hasNavPermission(child));
  };

  // Admin/Staff navigation items with proper permissions
  const adminStaffNavItems: NavItem[] = [
    // Dashboard - all admin/staff can see
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    
    // LOAN OPERATIONS MENU
    {
      name: 'Loan Operations',
      href: '#',
      icon: FileCheck,
      permission: 'view_loans',
      children: [
        { name: 'Applications', href: '/admin/applications', icon: FileText, permission: 'view_applications' },
        { name: 'Loan Approval', href: '/admin/loan-approval', icon: CheckCircle, permission: 'approve_loans' },
        { name: 'Disbursements', href: '/admin/disbursement', icon: Wallet, permission: 'manage_disbursements' },
        { name: 'Loan History', href: '/admin/loan-history', icon: Clock, permission: 'view_loans' },
      ]
    },
    
    // CUSTOMER MANAGEMENT
    {
      name: 'Customers',
      href: '#',
      icon: Users,
      permission: 'view_customers', 
      children: [
        { name: 'Customer List', href: '/admin/customers', icon: Users, permission: 'view_customers' },
        { name: 'Blacklist', href: '/admin/blacklist', icon: Lock, permission: 'blacklist_customers' },
      ]
    },
    
    // ACCOUNTS MENU
    {
      name: 'Accounts',
      href: '#',
      icon: Banknote,
      permission: 'view_accounts', 
      children: [
        { name: 'CASA Accounts', href: '/admin/accounts', icon: Banknote, permission: 'view_accounts' },
        { name: 'Transactions', href: '/admin/transactions', icon: ArrowRightLeft, permission: 'view_transactions' },
        { name: 'General Ledger', href: '/admin/general-ledger', icon: BookOpen, permission: 'view_gl_accounts' },
      ]
    },
    
    // FINANCIAL SETTINGS
    {
      name: 'Financial Settings',
      href: '#',
      icon: DollarSign,
      permission: 'view_interests', 
      children: [
        { name: 'Interest Rates', href: '/admin/interest-management', icon: Percent, permission: 'view_interests' },
        { name: 'Fee Management', href: '/admin/fee-management', icon: FeeIcon, permission: 'view_fees' },
        { name: 'Loan Products', href: '/admin/loan-products', icon: TrendingUp, permission: 'manage_loan_products' },
      ]
    },
    
    // ADMINISTRATION
    {
      name: 'Administration',
      href: '#',
      icon: Shield,
      permission: 'view_users',
      children: [
        { name: 'Staff Management', href: '/admin/staff', icon: UserPlus, permission: 'view_users' },
        { name: 'Role Management', href: '/admin/roles', icon: UserCheck, permission: 'view_roles' },
      ]
    },
    
    // REPORTS & ANALYTICS
    {
      name: 'Reports',
      href: '#',
      icon: BarChart3,
      permission: 'view_reports',
      children: [
        { name: 'Financial Reports', href: '/admin/financial-reports', icon: PieChart, permission: 'view_reports' },
        { name: 'Loan Reports', href: '/admin/loan-reports', icon: FileBarChart, permission: 'view_loan_reports' },
        { name: 'Customer Reports', href: '/admin/customer-reports', icon: Users, permission: 'view_customer_reports' },
        { name: 'Audit Trail', href: '/admin/audit', icon: Activity, permission: 'view_audit_trail' },
      ]
    },
    
    // SYSTEM SETTINGS
    {
      name: 'System',
      href: '#',
      icon: Settings,
      permission: 'manage_system', 
      children: [
        { name: 'System Settings', href: '/admin/settings', icon: Settings, permission: 'manage_system' },
        //{ name: 'Email Templates', href: '/admin/email-templates', icon: Receipt, permission: 'manage_email_templates' },
      ]
    },
  ];

  // Customer navigation items
  const customerNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Apply for Loan', href: '/apply', icon: FileText },
    { name: 'Loan History', href: '/history', icon: Clock },
    { name: 'Repayments', href: '/repayment', icon: CreditCard },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  // Determine which navigation items to show based on user role
  const getNavItems = (): NavItem[] => {
    if (!user) return [];
    
    if (user.role === 'admin' || user.role === 'staff') {
      // Filter items based on permissions
      return adminStaffNavItems.filter(item => {
        // If item has children, check if user can see any child
        if (item.children && item.children.length > 0) {
          return hasAnyChildPermission(item);
        }
        // If single item, check permission
        return hasNavPermission(item);
      });
    }
    
    return customerNavItems;
  };

  const navItems = getNavItems();

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = hasChildren ? isMenuActive(item.children!) : location.pathname === item.href;
    const isExpanded = expandedMenus.has(item.name);
    const paddingLeft = 6 + (level * 4);

    const linkContent = (
      <div
        className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors duration-200 ${
          isActive
            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <div className="flex items-center">
          <item.icon className="w-5 h-5 mr-3" />
          {item.name}
        </div>
        {hasChildren && (
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        )}
      </div>
    );

    // For items with children
    if (hasChildren) {
      // Filter children based on permissions
      const allowedChildren = item.children!.filter(child => hasNavPermission(child));
      
      // Don't render parent if no children are allowed
      if (allowedChildren.length === 0) return null;

      return (
        <div key={item.name}>
          <button
            onClick={() => toggleMenu(item.name)}
            className="w-full text-left"
          >
            {linkContent}
          </button>
          {isExpanded && (
            <div className="bg-gray-50 border-l-2 border-blue-200 ml-4">
              {allowedChildren.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // For single items
    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => setSidebarOpen(false)}
      >
        {linkContent}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        
        <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 bg-blue-600">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="ml-2 text-xl font-bold text-white">BankApp</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="px-6 mb-4 mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {user?.role === 'admin' ? 'Administration' : 
               user?.role === 'staff' ? 'Staff Portal' : 
               'Customer Portal'}
            </p>
          </div>
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="flex-shrink-0 p-6 border-t bg-white">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <div className="flex items-center mt-1">
  <span className={`text-xs px-2 py-1 rounded-full ${
    user?.role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : user?.role === 'staff'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800'
  }`}>
    {roleName || user?.role?.toUpperCase()}
  </span>
</div>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="lg:hidden flex items-center justify-between h-16 px-6 bg-white shadow-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="ml-2 text-lg font-bold text-gray-900">BankApp</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 w-full">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;