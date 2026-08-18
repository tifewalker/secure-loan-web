import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, UserCheck, Settings, LogOut,
  Menu, X, ChevronDown, ChevronRight, ChevronsUpDown, Bell, Search, Wallet,
  TrendingUp, Percent, BookOpen, Shield, CreditCard, ArrowLeftRight,
  ScrollText, UserCog, Banknote, Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}


const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Loan Operations',
    href: '#',
    icon: Banknote,
    children: [
      { name: 'Applications', href: '/admin/applications', icon: FileText },
      { name: 'Review', href: '/admin/review', icon: UserCheck },
      { name: 'Disbursement', href: '/admin/disbursement', icon: Wallet },
    ],
  },
  {
    name: 'Customer Management',
    href: '/admin/customers',
    icon: Users,
  },
  {
    name: 'Accounts',
    href: '#',
    icon: BookOpen,
    children: [
      { name: 'CASA Accounts', href: '/admin/accounts', icon: CreditCard },
      { name: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
      { name: 'General Ledger', href: '/admin/general-ledger', icon: BookOpen },
    ],
  },
  {
    name: 'Financial Settings',
    href: '#',
    icon: TrendingUp,
    children: [
      { name: 'Interest Management', href: '/admin/interest-management', icon: Percent },
      { name: 'Fee Management', href: '/admin/fee-management', icon: ScrollText },
    ],
  },
  {
    name: 'Administration',
    href: '#',
    icon: Shield,
    children: [
      { name: 'Staff', href: '/admin/staff', icon: Users },
      { name: 'Roles', href: '/admin/roles', icon: UserCog },
      { name: 'Loan Products', href: '/admin/loan-products', icon: Building2 },
    ],
  },
  {
    name: 'Reports',
    href: '#',
    icon: ScrollText,
    children: [
      { name: 'Loan Reports', href: '/admin/reports', icon: FileText },
      { name: 'Audit Trail', href: '/admin/audit', icon: Shield },
    ],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

function UserFooter() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userInitials = user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.role}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" side="top">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserCog className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
              <Settings className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (item: NavItem) =>
    !!item.children?.some((c) => location.pathname === c.href);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Banknote className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LoanApp</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Console</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = !!item.children?.length;

                if (!hasChildren) {
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.name}>
                        <Link to={item.href}>
                          <Icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <Collapsible
                    key={item.name}
                    asChild
                    defaultOpen={isParentActive(item)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.name} isActive={isParentActive(item)}>
                          <Icon />
                          <span>{item.name}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <SidebarMenuSubItem key={child.name}>
                                <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                                  <Link to={child.href}>
                                    <ChildIcon />
                                    <span>{child.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;