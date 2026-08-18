import { useState, useEffect, useCallback, useRef } from 'react';
import { reportService, LoanReport } from '@/services/report.service';

type ReportType = 'active' | 'closed' | 'disbursed';

export const useReports = () => {
  const [activeLoans, setActiveLoans] = useState<LoanReport[]>([]);
  const [closedLoans, setClosedLoans] = useState<LoanReport[]>([]);
  const [disbursedLoans, setDisbursedLoans] = useState<LoanReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportType>('active');
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchAllReports = useCallback(async () => {
    if (hasFetchedRef.current) return;
    
    hasFetchedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const [active, closed, disbursed] = await Promise.all([
        reportService.getActiveLoans(),
        reportService.getClosedLoans(),
        reportService.getDisbursedLoans(),
      ]);

      setActiveLoans(active);
      setClosedLoans(closed);
      setDisbursedLoans(disbursed);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentLoans = (): LoanReport[] => {
    switch (activeTab) {
      case 'active':
        return activeLoans;
      case 'closed':
        return closedLoans;
      case 'disbursed':
        return disbursedLoans;
      default:
        return [];
    }
  };

  const getSummaryStats = () => {
    const currentLoans = getCurrentLoans();
    return {
      totalLoans: currentLoans.length,
      totalPrincipal: currentLoans.reduce((sum, loan) => sum + loan.principalAmount, 0),
      totalInterest: currentLoans.reduce((sum, loan) => sum + loan.interestAmount, 0),
      totalRepayable: currentLoans.reduce((sum, loan) => sum + loan.totalRepayable, 0),
      totalOutstanding: currentLoans.reduce((sum, loan) => sum + loan.outstandingPrincipal + loan.outstandingInterest, 0),
    };
  };

  return {
    activeLoans,
    closedLoans,
    disbursedLoans,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    getCurrentLoans,
    getSummaryStats,
    fetchAllReports,
  };
};