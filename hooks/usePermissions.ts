import { UserRole } from '@/types';

/**
 * Role permission helpers for NGI Property Hub V2.
 *
 * Role matrix:
 *   Admin / President   — full access: read, write, delete, approve, manage team
 *   Partner / Investor  — read all, write properties/expenses, approve expenses, no team management
 *   Project Manager     — read all, write properties/expenses/timeline, no financial approval
 *   Contractor          — read assigned properties, add expenses/photos for assigned work only
 *   Accountant/Finance  — read all financial data, approve expenses, no structural writes
 *   Tenant              — future: view own unit, submit maintenance requests
 *   Viewer              — read-only on all sections
 *
 * TODO (V2 backend): Enforce these same rules server-side in the API middleware.
 * Client-side checks are UX-only; the server must be the authority.
 */

export interface Permissions {
  canViewDashboard: boolean;
  canViewProperties: boolean;
  canAddProperty: boolean;
  canEditProperty: boolean;
  canDeleteProperty: boolean;
  canViewExpenses: boolean;
  canAddExpense: boolean;
  canDeleteExpense: boolean;
  canApproveExpense: boolean;
  canViewBudget: boolean;
  canEditBudget: boolean;
  canViewTimeline: boolean;
  canAddTimelineEvent: boolean;
  canViewDocs: boolean;
  canAddDoc: boolean;
  canViewPhotos: boolean;
  canAddPhoto: boolean;
  canViewRentals: boolean;
  canManageRentals: boolean;
  canViewMaintenance: boolean;
  canSubmitMaintenance: boolean;
  canResolveMaintenance: boolean;
  canViewReports: boolean;
  canViewFinancials: boolean;
  canManageTeam: boolean;
  canChangeSettings: boolean;
}

export function getPermissions(role: UserRole | null): Permissions {
  const none: Permissions = {
    canViewDashboard: false,
    canViewProperties: false,
    canAddProperty: false,
    canEditProperty: false,
    canDeleteProperty: false,
    canViewExpenses: false,
    canAddExpense: false,
    canDeleteExpense: false,
    canApproveExpense: false,
    canViewBudget: false,
    canEditBudget: false,
    canViewTimeline: false,
    canAddTimelineEvent: false,
    canViewDocs: false,
    canAddDoc: false,
    canViewPhotos: false,
    canAddPhoto: false,
    canViewRentals: false,
    canManageRentals: false,
    canViewMaintenance: false,
    canSubmitMaintenance: false,
    canResolveMaintenance: false,
    canViewReports: false,
    canViewFinancials: false,
    canManageTeam: false,
    canChangeSettings: false,
  };

  if (!role) return none;

  switch (role) {
    case 'Admin':
      return {
        canViewDashboard: true,
        canViewProperties: true,
        canAddProperty: true,
        canEditProperty: true,
        canDeleteProperty: true,
        canViewExpenses: true,
        canAddExpense: true,
        canDeleteExpense: true,
        canApproveExpense: true,
        canViewBudget: true,
        canEditBudget: true,
        canViewTimeline: true,
        canAddTimelineEvent: true,
        canViewDocs: true,
        canAddDoc: true,
        canViewPhotos: true,
        canAddPhoto: true,
        canViewRentals: true,
        canManageRentals: true,
        canViewMaintenance: true,
        canSubmitMaintenance: true,
        canResolveMaintenance: true,
        canViewReports: true,
        canViewFinancials: true,
        canManageTeam: true,
        canChangeSettings: true,
      };

    case 'Partner':
      return {
        canViewDashboard: true,
        canViewProperties: true,
        canAddProperty: true,
        canEditProperty: true,
        canDeleteProperty: false,
        canViewExpenses: true,
        canAddExpense: true,
        canDeleteExpense: false,
        canApproveExpense: true,
        canViewBudget: true,
        canEditBudget: true,
        canViewTimeline: true,
        canAddTimelineEvent: true,
        canViewDocs: true,
        canAddDoc: true,
        canViewPhotos: true,
        canAddPhoto: true,
        canViewRentals: true,
        canManageRentals: true,
        canViewMaintenance: true,
        canSubmitMaintenance: true,
        canResolveMaintenance: true,
        canViewReports: true,
        canViewFinancials: true,
        canManageTeam: false,
        canChangeSettings: false,
      };

    case 'Project Manager':
      return {
        canViewDashboard: true,
        canViewProperties: true,
        canAddProperty: true,
        canEditProperty: true,
        canDeleteProperty: false,
        canViewExpenses: true,
        canAddExpense: true,
        canDeleteExpense: false,
        canApproveExpense: false,
        canViewBudget: true,
        canEditBudget: true,
        canViewTimeline: true,
        canAddTimelineEvent: true,
        canViewDocs: true,
        canAddDoc: true,
        canViewPhotos: true,
        canAddPhoto: true,
        canViewRentals: true,
        canManageRentals: false,
        canViewMaintenance: true,
        canSubmitMaintenance: true,
        canResolveMaintenance: true,
        canViewReports: true,
        canViewFinancials: false,
        canManageTeam: false,
        canChangeSettings: false,
      };

    case 'Contractor':
      return {
        canViewDashboard: false,
        canViewProperties: true,
        canAddProperty: false,
        canEditProperty: false,
        canDeleteProperty: false,
        canViewExpenses: true,
        canAddExpense: true,
        canDeleteExpense: false,
        canApproveExpense: false,
        canViewBudget: false,
        canEditBudget: false,
        canViewTimeline: true,
        canAddTimelineEvent: false,
        canViewDocs: false,
        canAddDoc: false,
        canViewPhotos: true,
        canAddPhoto: true,
        canViewRentals: false,
        canManageRentals: false,
        canViewMaintenance: true,
        canSubmitMaintenance: false,
        canResolveMaintenance: true,
        canViewReports: false,
        canViewFinancials: false,
        canManageTeam: false,
        canChangeSettings: false,
      };

    case 'Accountant':
      return {
        canViewDashboard: true,
        canViewProperties: true,
        canAddProperty: false,
        canEditProperty: false,
        canDeleteProperty: false,
        canViewExpenses: true,
        canAddExpense: true,
        canDeleteExpense: false,
        canApproveExpense: true,
        canViewBudget: true,
        canEditBudget: false,
        canViewTimeline: true,
        canAddTimelineEvent: false,
        canViewDocs: true,
        canAddDoc: true,
        canViewPhotos: true,
        canAddPhoto: false,
        canViewRentals: true,
        canManageRentals: false,
        canViewMaintenance: true,
        canSubmitMaintenance: false,
        canResolveMaintenance: false,
        canViewReports: true,
        canViewFinancials: true,
        canManageTeam: false,
        canChangeSettings: false,
      };

    case 'Viewer':
    default:
      return {
        ...none,
        canViewDashboard: true,
        canViewProperties: true,
        canViewExpenses: true,
        canViewBudget: true,
        canViewTimeline: true,
        canViewDocs: true,
        canViewPhotos: true,
        canViewRentals: true,
        canViewMaintenance: true,
        canViewReports: true,
        canViewFinancials: false,
      };
  }
}

/**
 * Hook version — pass user role from AuthContext.
 * Usage: const perms = usePermissions(user?.role ?? null);
 */
export function usePermissions(role: UserRole | null): Permissions {
  return getPermissions(role);
}
