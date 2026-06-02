export type UserRole = 'Admin' | 'Partner' | 'Project Manager' | 'Contractor' | 'Accountant' | 'Viewer';

export type PropertyStatus =
  | 'Under Contract'
  | 'Purchased'
  | 'Renovating'
  | 'Listed'
  | 'Sold'
  | 'Rented'
  | 'Completed';

export type PropertyType = 'Single Family' | 'Multi-Family' | 'Condo' | 'Commercial' | 'Land';

export type PhotoCategory = 'Before' | 'Progress' | 'After';

export type DocumentType =
  | 'Closing Document'
  | 'Loan Document'
  | 'Permit'
  | 'Contractor Agreement'
  | 'Invoice'
  | 'Receipt'
  | 'Lien Waiver'
  | 'Draw Request'
  | 'Insurance'
  | 'Inspection Report'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  estimated: number;
  actual: number;
}

export interface TimelineEvent {
  id: string;
  propertyId: string;
  title: string;
  date: string;
  note?: string;
  addedBy: string;
}

export interface Expense {
  id: string;
  propertyId: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  paymentMethod: string;
  notes?: string;
  approvedBy?: string;
}

export interface PropertyPhoto {
  id: string;
  uri: string;
  category: PhotoCategory;
  caption?: string;
  date: string;
  addedBy: string;
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: DocumentType;
  date: string;
  notes?: string;
  addedBy: string;
}

export interface SaleInfo {
  salePrice: number;
  closingDate: string;
  sellingClosingCosts: number;
  realtorCommission: number;
  attorneyFee: number;
  lenderPayoff: number;
  otherSellingExpenses: number;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: PropertyType;
  purchasePrice: number;
  closingDate: string;
  closingCosts: number;
  lenderName?: string;
  loanNumber?: string;
  status: PropertyStatus;
  notes?: string;
  propertyPhotos: PropertyPhoto[];
  documents: PropertyDocument[];
  budgetItems: BudgetItem[];
  saleInfo?: SaleInfo;
  createdAt: string;
}

export const BUDGET_CATEGORIES = [
  'Labor',
  'Materials',
  'Permits',
  'Dumpster / Cleanout',
  'Kitchen Renovation',
  'Bathroom Renovation',
  'Flooring',
  'Roofing',
  'Siding',
  'Windows',
  'Plumbing',
  'Electrical',
  'Painting',
  'Appliances',
  'HVAC',
  'Landscaping',
  'Other',
];

export type RentPaymentStatus = 'Paid' | 'Pending' | 'Late';
export type MaintenancePriority = 'Low' | 'Medium' | 'High';
export type MaintenanceStatus = 'Open' | 'In Progress' | 'Completed';
export type TenantStatus = 'Active' | 'Vacant' | 'Ending Soon';

export interface RentalUnit {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: PropertyType;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  monthlyRent: number;
  leaseStart: string;
  leaseEnd: string;
  securityDeposit: number;
  status: TenantStatus;
  notes?: string;
  createdAt: string;
}

export interface RentPayment {
  id: string;
  unitId: string;
  month: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: RentPaymentStatus;
  notes?: string;
}

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  title: string;
  description?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  dateSubmitted: string;
  dateCompleted?: string;
  estimatedCost?: number;
  actualCost?: number;
  vendor?: string;
  submittedBy: string;
}

export const EXPENSE_CATEGORIES = [
  'Labor',
  'Materials',
  'Permits',
  'Utilities',
  'Violations',
  'Insurance',
  'Legal',
  'Inspection',
  'Cleaning',
  'Marketing',
  'Miscellaneous',
];

export const PAYMENT_METHODS = ['Check', 'ACH / Wire', 'Credit Card', 'Cash', 'Zelle', 'Other'];

export const PROPERTY_STATUSES: PropertyStatus[] = [
  'Under Contract',
  'Purchased',
  'Renovating',
  'Listed',
  'Sold',
  'Rented',
  'Completed',
];

export const PROPERTY_TYPES: PropertyType[] = [
  'Single Family',
  'Multi-Family',
  'Condo',
  'Commercial',
  'Land',
];

export const DOCUMENT_TYPES: DocumentType[] = [
  'Closing Document',
  'Loan Document',
  'Permit',
  'Contractor Agreement',
  'Invoice',
  'Receipt',
  'Lien Waiver',
  'Draw Request',
  'Insurance',
  'Inspection Report',
  'Other',
];

export const PHOTO_CATEGORIES: PhotoCategory[] = ['Before', 'Progress', 'After'];

export type RenovationPhase =
  | 'Demo'
  | 'Framing'
  | 'Rough-In'
  | 'Insulation'
  | 'Drywall'
  | 'Flooring'
  | 'Painting'
  | 'Trim & Finish'
  | 'Kitchen'
  | 'Bathroom'
  | 'Exterior'
  | 'Landscaping'
  | 'Final Walkthrough'
  | 'Other';

/**
 * A progress log entry for an active renovation property.
 * Tracks phase, percent complete, and optional photo references.
 * Stored locally under 'ngi_renovation_updates_v1'.
 *
 * TODO (V2 backend): Wire to POST /api/renovation-updates with photo upload support.
 */
export interface RenovationUpdate {
  id: string;
  propertyId: string;
  title: string;
  description?: string;
  phase: RenovationPhase;
  percentComplete: number;
  date: string;
  addedBy: string;
  photoUris?: string[];
}

export const RENOVATION_PHASES: RenovationPhase[] = [
  'Demo',
  'Framing',
  'Rough-In',
  'Insulation',
  'Drywall',
  'Flooring',
  'Painting',
  'Trim & Finish',
  'Kitchen',
  'Bathroom',
  'Exterior',
  'Landscaping',
  'Final Walkthrough',
  'Other',
];
