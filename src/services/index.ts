import { customerService } from './customer.service';
import { staffService } from './staff.service';
import { roleService } from './role.service';
import { feeService } from './fee.service';
import { interestService } from './interest.service';
import { loanService } from './loan.service';
import { glAccountService } from './gl-account.service';
import { authService } from './auth.service';
import { dashboardService } from './dashboard.service';

export {
  customerService,
  staffService,
  roleService,
  feeService,
  interestService,
  loanService,
  glAccountService,
  authService,
  dashboardService
};

export const apiService = {
  customers: customerService,
  staff: staffService,
  roles: roleService,
  fees: feeService,
  interests: interestService,
  loans: loanService,
  glAccounts: glAccountService,
  auth: authService,
  dashboard: dashboardService
};

export default apiService;