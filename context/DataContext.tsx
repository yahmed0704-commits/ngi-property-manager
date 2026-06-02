import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  BudgetItem,
  Expense,
  Property,
  PropertyDocument,
  PropertyPhoto,
  TimelineEvent,
} from '@/types';

const SAMPLE_PROPERTIES: Property[] = [
  {
    id: 'p1',
    address: '142 Maple Street',
    city: 'Newark',
    state: 'NJ',
    zip: '07102',
    type: 'Single Family',
    purchasePrice: 185000,
    closingDate: '2025-02-14',
    closingCosts: 4200,
    lenderName: 'First National Bank',
    loanNumber: 'FNB-2025-0142',
    status: 'Renovating',
    notes: 'Full gut renovation. Targeting ARV of $310,000.',
    propertyPhotos: [],
    documents: [
      { id: 'd1', name: 'Purchase Agreement.pdf', type: 'Closing Document', date: '2025-02-14', addedBy: 'Alex Rivera' },
      { id: 'd2', name: 'Building Permit.pdf', type: 'Permit', date: '2025-02-25', addedBy: 'Jordan Lee' },
      { id: 'd3', name: 'Pro Renovations Contract.pdf', type: 'Contractor Agreement', date: '2025-03-01', addedBy: 'Alex Rivera', notes: 'Full gut reno scope' },
    ],
    budgetItems: [
      { id: 'b1', category: 'Kitchen Renovation', estimated: 22000, actual: 19800 },
      { id: 'b2', category: 'Bathroom Renovation', estimated: 12000, actual: 10500 },
      { id: 'b3', category: 'Flooring', estimated: 9000, actual: 8750 },
      { id: 'b4', category: 'Roofing', estimated: 15000, actual: 14200 },
      { id: 'b5', category: 'Electrical', estimated: 8500, actual: 9100 },
      { id: 'b6', category: 'Plumbing', estimated: 7000, actual: 6800 },
      { id: 'b7', category: 'Painting', estimated: 5500, actual: 5200 },
      { id: 'b8', category: 'Labor', estimated: 18000, actual: 17400 },
    ],
    createdAt: '2025-02-01T10:00:00Z',
  },
  {
    id: 'p2',
    address: '78 Cedar Avenue',
    city: 'Elizabeth',
    state: 'NJ',
    zip: '07201',
    type: 'Single Family',
    purchasePrice: 210000,
    closingDate: '2024-11-05',
    closingCosts: 5100,
    lenderName: 'NJ Lending Group',
    loanNumber: 'NJL-2024-0078',
    status: 'Sold',
    notes: 'Completed flip. Sold above asking price.',
    propertyPhotos: [],
    documents: [
      { id: 'd10', name: 'Purchase Agreement.pdf', type: 'Closing Document', date: '2024-11-05', addedBy: 'Alex Rivera' },
      { id: 'd11', name: 'Loan Documents.pdf', type: 'Loan Document', date: '2024-11-05', addedBy: 'Alex Rivera' },
      { id: 'd12', name: 'Sale Closing Docs.pdf', type: 'Closing Document', date: '2025-01-22', addedBy: 'Alex Rivera' },
      { id: 'd13', name: 'Elite Builders Contract.pdf', type: 'Contractor Agreement', date: '2024-11-15', addedBy: 'Jordan Lee' },
    ],
    budgetItems: [
      { id: 'b9', category: 'Kitchen Renovation', estimated: 25000, actual: 24500 },
      { id: 'b10', category: 'Bathroom Renovation', estimated: 14000, actual: 13200 },
      { id: 'b11', category: 'Flooring', estimated: 10000, actual: 9800 },
      { id: 'b12', category: 'Painting', estimated: 6000, actual: 5900 },
      { id: 'b13', category: 'Labor', estimated: 20000, actual: 19500 },
    ],
    saleInfo: {
      salePrice: 319000,
      closingDate: '2025-01-22',
      sellingClosingCosts: 3200,
      realtorCommission: 9570,
      attorneyFee: 1500,
      lenderPayoff: 160000,
      otherSellingExpenses: 800,
    },
    createdAt: '2024-10-20T09:00:00Z',
  },
  // Historical Projects
  {
    id: 'p3',
    address: '234 Oak Boulevard',
    city: 'Trenton',
    state: 'NJ',
    zip: '08609',
    type: 'Single Family',
    purchasePrice: 165000,
    closingDate: '2024-04-10',
    closingCosts: 3800,
    lenderName: 'Capital City Lenders',
    loanNumber: 'CCL-2024-0234',
    status: 'Sold',
    notes: 'Kitchen and bath full renovation. Strong ARV on this block.',
    propertyPhotos: [],
    documents: [
      { id: 'd20', name: 'Purchase Closing.pdf', type: 'Closing Document', date: '2024-04-10', addedBy: 'Alex Rivera' },
      { id: 'd21', name: 'Renovation Permit.pdf', type: 'Permit', date: '2024-04-22', addedBy: 'Jordan Lee' },
      { id: 'd22', name: 'Sale Closing Package.pdf', type: 'Closing Document', date: '2024-09-18', addedBy: 'Alex Rivera' },
    ],
    budgetItems: [
      { id: 'b20', category: 'Kitchen Renovation', estimated: 20000, actual: 19400 },
      { id: 'b21', category: 'Bathroom Renovation', estimated: 11000, actual: 10800 },
      { id: 'b22', category: 'Flooring', estimated: 8500, actual: 8200 },
      { id: 'b23', category: 'Roofing', estimated: 12000, actual: 11500 },
      { id: 'b24', category: 'Painting', estimated: 5000, actual: 4800 },
      { id: 'b25', category: 'Labor', estimated: 16000, actual: 15600 },
    ],
    saleInfo: {
      salePrice: 278000,
      closingDate: '2024-09-18',
      sellingClosingCosts: 2800,
      realtorCommission: 8340,
      attorneyFee: 1400,
      lenderPayoff: 124000,
      otherSellingExpenses: 600,
    },
    createdAt: '2024-03-15T09:00:00Z',
  },
  {
    id: 'p4',
    address: '567 Pine Road',
    city: 'Camden',
    state: 'NJ',
    zip: '08103',
    type: 'Single Family',
    purchasePrice: 145000,
    closingDate: '2023-09-20',
    closingCosts: 3200,
    lenderName: 'Tri-State Funding',
    loanNumber: 'TSF-2023-0567',
    status: 'Sold',
    notes: 'Fast flip — 4 months start to close. Clean cosmetic renovation.',
    propertyPhotos: [],
    documents: [
      { id: 'd30', name: 'Purchase Agreement.pdf', type: 'Closing Document', date: '2023-09-20', addedBy: 'Alex Rivera' },
      { id: 'd31', name: 'Contractor Agreement.pdf', type: 'Contractor Agreement', date: '2023-10-02', addedBy: 'Jordan Lee' },
      { id: 'd32', name: 'Final Lien Waiver.pdf', type: 'Lien Waiver', date: '2024-01-10', addedBy: 'Jordan Lee' },
      { id: 'd33', name: 'Sale Closing.pdf', type: 'Closing Document', date: '2024-01-30', addedBy: 'Alex Rivera' },
    ],
    budgetItems: [
      { id: 'b30', category: 'Kitchen Renovation', estimated: 15000, actual: 14200 },
      { id: 'b31', category: 'Bathroom Renovation', estimated: 9000, actual: 8600 },
      { id: 'b32', category: 'Flooring', estimated: 7500, actual: 7200 },
      { id: 'b33', category: 'Painting', estimated: 4500, actual: 4300 },
      { id: 'b34', category: 'Labor', estimated: 14000, actual: 13500 },
    ],
    saleInfo: {
      salePrice: 255000,
      closingDate: '2024-01-30',
      sellingClosingCosts: 2500,
      realtorCommission: 7650,
      attorneyFee: 1200,
      lenderPayoff: 109000,
      otherSellingExpenses: 500,
    },
    createdAt: '2023-08-25T09:00:00Z',
  },
  {
    id: 'p5',
    address: '89 Birch Lane',
    city: 'Irvington',
    state: 'NJ',
    zip: '07111',
    type: 'Single Family',
    purchasePrice: 190000,
    closingDate: '2023-05-15',
    closingCosts: 4500,
    lenderName: 'Metro Capital',
    loanNumber: 'MC-2023-0089',
    status: 'Sold',
    notes: 'Full gut renovation including addition. Best ROI to date.',
    propertyPhotos: [],
    documents: [
      { id: 'd40', name: 'Purchase Closing.pdf', type: 'Closing Document', date: '2023-05-15', addedBy: 'Alex Rivera' },
      { id: 'd41', name: 'Building Permit.pdf', type: 'Permit', date: '2023-05-28', addedBy: 'Jordan Lee' },
      { id: 'd42', name: 'Draw Request #1.pdf', type: 'Draw Request', date: '2023-07-10', addedBy: 'Jordan Lee' },
      { id: 'd43', name: 'Draw Request #2.pdf', type: 'Draw Request', date: '2023-09-05', addedBy: 'Jordan Lee' },
      { id: 'd44', name: 'Sale Closing Package.pdf', type: 'Closing Document', date: '2023-12-08', addedBy: 'Alex Rivera' },
    ],
    budgetItems: [
      { id: 'b40', category: 'Kitchen Renovation', estimated: 28000, actual: 27200 },
      { id: 'b41', category: 'Bathroom Renovation', estimated: 16000, actual: 15400 },
      { id: 'b42', category: 'Flooring', estimated: 11000, actual: 10500 },
      { id: 'b43', category: 'Roofing', estimated: 14000, actual: 13800 },
      { id: 'b44', category: 'Electrical', estimated: 9000, actual: 8700 },
      { id: 'b45', category: 'Plumbing', estimated: 8000, actual: 7600 },
      { id: 'b46', category: 'Painting', estimated: 7000, actual: 6800 },
      { id: 'b47', category: 'Labor', estimated: 22000, actual: 21500 },
    ],
    saleInfo: {
      salePrice: 325000,
      closingDate: '2023-12-08',
      sellingClosingCosts: 3100,
      realtorCommission: 9750,
      attorneyFee: 1500,
      lenderPayoff: 143000,
      otherSellingExpenses: 700,
    },
    createdAt: '2023-04-20T09:00:00Z',
  },
  {
    id: 'p6',
    address: '412 Elm Street',
    city: 'Jersey City',
    state: 'NJ',
    zip: '07302',
    type: 'Multi-Family',
    purchasePrice: 320000,
    closingDate: '2022-10-05',
    closingCosts: 7200,
    lenderName: 'Hudson River Lending',
    loanNumber: 'HRL-2022-0412',
    status: 'Sold',
    notes: '2-family house. Both units renovated. Sold to investor buyer.',
    propertyPhotos: [],
    documents: [
      { id: 'd50', name: 'Purchase Agreement.pdf', type: 'Closing Document', date: '2022-10-05', addedBy: 'Alex Rivera' },
      { id: 'd51', name: 'Loan Docs Package.pdf', type: 'Loan Document', date: '2022-10-05', addedBy: 'Alex Rivera' },
      { id: 'd52', name: 'Contractor Agreement.pdf', type: 'Contractor Agreement', date: '2022-10-20', addedBy: 'Jordan Lee' },
      { id: 'd53', name: 'Final Inspection.pdf', type: 'Inspection Report', date: '2023-04-12', addedBy: 'Jordan Lee' },
      { id: 'd54', name: 'Sale Closing.pdf', type: 'Closing Document', date: '2023-05-30', addedBy: 'Alex Rivera' },
    ],
    budgetItems: [
      { id: 'b50', category: 'Kitchen Renovation', estimated: 35000, actual: 34200 },
      { id: 'b51', category: 'Bathroom Renovation', estimated: 20000, actual: 19500 },
      { id: 'b52', category: 'Flooring', estimated: 14000, actual: 13800 },
      { id: 'b53', category: 'Roofing', estimated: 18000, actual: 17600 },
      { id: 'b54', category: 'Electrical', estimated: 12000, actual: 11800 },
      { id: 'b55', category: 'Plumbing', estimated: 10000, actual: 9700 },
      { id: 'b56', category: 'Painting', estimated: 8000, actual: 7900 },
      { id: 'b57', category: 'Labor', estimated: 30000, actual: 29500 },
    ],
    saleInfo: {
      salePrice: 498000,
      closingDate: '2023-05-30',
      sellingClosingCosts: 4500,
      realtorCommission: 14940,
      attorneyFee: 2000,
      lenderPayoff: 240000,
      otherSellingExpenses: 1200,
    },
    createdAt: '2022-09-01T09:00:00Z',
  },
];

const SAMPLE_EXPENSES: Expense[] = [
  { id: 'e1', propertyId: 'p1', category: 'Materials', vendor: 'Home Depot', amount: 3450, date: '2025-03-10', paymentMethod: 'Credit Card', notes: 'Kitchen cabinets and countertops', approvedBy: 'Alex Rivera' },
  { id: 'e2', propertyId: 'p1', category: 'Labor', vendor: 'Pro Renovations LLC', amount: 8500, date: '2025-03-15', paymentMethod: 'Check', notes: 'First draw – kitchen and bath', approvedBy: 'Alex Rivera' },
  { id: 'e3', propertyId: 'p1', category: 'Permits', vendor: 'City of Newark', amount: 850, date: '2025-02-20', paymentMethod: 'Check', notes: 'Building permit' },
  { id: 'e4', propertyId: 'p1', category: 'Materials', vendor: 'Floor & Decor', amount: 4200, date: '2025-03-22', paymentMethod: 'Credit Card', notes: 'Hardwood flooring' },
  { id: 'e5', propertyId: 'p2', category: 'Labor', vendor: 'Elite Builders', amount: 19500, date: '2024-12-01', paymentMethod: 'ACH / Wire', notes: 'Full renovation labor', approvedBy: 'Alex Rivera' },
  { id: 'e6', propertyId: 'p2', category: 'Materials', vendor: 'Lowes', amount: 8700, date: '2024-11-28', paymentMethod: 'Credit Card', notes: 'All materials' },
  { id: 'e7', propertyId: 'p3', category: 'Labor', vendor: 'Newark Contractors', amount: 15600, date: '2024-06-01', paymentMethod: 'Check', approvedBy: 'Alex Rivera' },
  { id: 'e8', propertyId: 'p3', category: 'Materials', vendor: 'Home Depot', amount: 12400, date: '2024-05-20', paymentMethod: 'Credit Card' },
  { id: 'e9', propertyId: 'p4', category: 'Labor', vendor: 'All-Star Renovations', amount: 13500, date: '2023-11-10', paymentMethod: 'Check', approvedBy: 'Alex Rivera' },
  { id: 'e10', propertyId: 'p4', category: 'Materials', vendor: 'Lowes', amount: 6800, date: '2023-10-28', paymentMethod: 'Credit Card' },
  { id: 'e11', propertyId: 'p5', category: 'Labor', vendor: 'Pro Build Group', amount: 21500, date: '2023-08-01', paymentMethod: 'ACH / Wire', approvedBy: 'Alex Rivera' },
  { id: 'e12', propertyId: 'p5', category: 'Materials', vendor: 'Home Depot', amount: 15800, date: '2023-07-15', paymentMethod: 'Credit Card' },
  { id: 'e13', propertyId: 'p6', category: 'Labor', vendor: 'Metro Builders LLC', amount: 29500, date: '2023-01-15', paymentMethod: 'ACH / Wire', approvedBy: 'Alex Rivera' },
  { id: 'e14', propertyId: 'p6', category: 'Materials', vendor: 'Home Depot', amount: 22600, date: '2022-12-10', paymentMethod: 'Credit Card' },
  { id: 'e15', propertyId: 'p6', category: 'Permits', vendor: 'Jersey City Building Dept', amount: 1800, date: '2022-10-25', paymentMethod: 'Check' },
];

const SAMPLE_TIMELINE: TimelineEvent[] = [
  { id: 't1', propertyId: 'p1', title: 'Property Purchased', date: '2025-02-14', addedBy: 'Alex Rivera', note: 'Closed at First National Bank.' },
  { id: 't2', propertyId: 'p1', title: 'Demo / Cleanout Started', date: '2025-02-20', addedBy: 'Jordan Lee' },
  { id: 't3', propertyId: 'p1', title: 'Permits Approved', date: '2025-02-25', addedBy: 'Jordan Lee', note: 'Building and electrical permits in hand.' },
  { id: 't4', propertyId: 'p1', title: 'Kitchen Renovation Started', date: '2025-03-05', addedBy: 'Jordan Lee' },
  { id: 't5', propertyId: 'p2', title: 'Property Purchased', date: '2024-11-05', addedBy: 'Alex Rivera' },
  { id: 't6', propertyId: 'p2', title: 'Renovation Completed', date: '2024-12-28', addedBy: 'Jordan Lee' },
  { id: 't7', propertyId: 'p2', title: 'Listed for Sale', date: '2025-01-03', addedBy: 'Alex Rivera', note: 'Listed at $319,000.' },
  { id: 't8', propertyId: 'p2', title: 'Offer Accepted', date: '2025-01-10', addedBy: 'Alex Rivera' },
  { id: 't9', propertyId: 'p2', title: 'Closing Completed', date: '2025-01-22', addedBy: 'Alex Rivera', note: 'Sold for $319,000.' },
  { id: 't10', propertyId: 'p3', title: 'Property Purchased', date: '2024-04-10', addedBy: 'Alex Rivera' },
  { id: 't11', propertyId: 'p3', title: 'Renovation Started', date: '2024-04-22', addedBy: 'Jordan Lee' },
  { id: 't12', propertyId: 'p3', title: 'Renovation Completed', date: '2024-08-01', addedBy: 'Jordan Lee' },
  { id: 't13', propertyId: 'p3', title: 'Listed for Sale', date: '2024-08-10', addedBy: 'Alex Rivera', note: 'Listed at $279,000.' },
  { id: 't14', propertyId: 'p3', title: 'Closing Completed', date: '2024-09-18', addedBy: 'Alex Rivera', note: 'Sold for $278,000.' },
  { id: 't15', propertyId: 'p4', title: 'Property Purchased', date: '2023-09-20', addedBy: 'Alex Rivera' },
  { id: 't16', propertyId: 'p4', title: 'Renovation Completed', date: '2024-01-08', addedBy: 'Jordan Lee', note: '4-month turnaround.' },
  { id: 't17', propertyId: 'p4', title: 'Closing Completed', date: '2024-01-30', addedBy: 'Alex Rivera', note: 'Sold for $255,000.' },
  { id: 't18', propertyId: 'p5', title: 'Property Purchased', date: '2023-05-15', addedBy: 'Alex Rivera' },
  { id: 't19', propertyId: 'p5', title: 'Permits Approved', date: '2023-05-28', addedBy: 'Jordan Lee' },
  { id: 't20', propertyId: 'p5', title: 'Draw Request #1 Submitted', date: '2023-07-10', addedBy: 'Jordan Lee' },
  { id: 't21', propertyId: 'p5', title: 'Draw Request #2 Submitted', date: '2023-09-05', addedBy: 'Jordan Lee' },
  { id: 't22', propertyId: 'p5', title: 'Renovation Completed', date: '2023-11-15', addedBy: 'Jordan Lee' },
  { id: 't23', propertyId: 'p5', title: 'Closing Completed', date: '2023-12-08', addedBy: 'Alex Rivera', note: 'Best ROI to date.' },
  { id: 't24', propertyId: 'p6', title: 'Property Purchased', date: '2022-10-05', addedBy: 'Alex Rivera' },
  { id: 't25', propertyId: 'p6', title: 'Full Gut Renovation Started', date: '2022-10-20', addedBy: 'Jordan Lee' },
  { id: 't26', propertyId: 'p6', title: 'Final Inspection Passed', date: '2023-04-12', addedBy: 'Jordan Lee' },
  { id: 't27', propertyId: 'p6', title: 'Listed for Sale', date: '2023-04-20', addedBy: 'Alex Rivera', note: 'Listed at $499,000 — investor deal.' },
  { id: 't28', propertyId: 'p6', title: 'Closing Completed', date: '2023-05-30', addedBy: 'Alex Rivera', note: 'Sold for $498,000 to investor buyer.' },
];

interface DataContextType {
  properties: Property[];
  expenses: Expense[];
  timeline: TimelineEvent[];
  addProperty: (p: Omit<Property, 'id' | 'createdAt'>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addTimelineEvent: (e: Omit<TimelineEvent, 'id'>) => void;
  addPhoto: (propertyId: string, photo: Omit<PropertyPhoto, 'id'>) => void;
  removePhoto: (propertyId: string, photoId: string) => void;
  addDocument: (propertyId: string, doc: Omit<PropertyDocument, 'id'>) => void;
  removeDocument: (propertyId: string, docId: string) => void;
  getPropertyExpenses: (propertyId: string) => Expense[];
  getPropertyTimeline: (propertyId: string) => TimelineEvent[];
  calcNetProfit: (property: Property) => number;
}

const DataContext = createContext<DataContextType | null>(null);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    (async () => {
      const storedProps = await AsyncStorage.getItem('ngi_properties_v2');
      const storedExp = await AsyncStorage.getItem('ngi_expenses');
      const storedTl = await AsyncStorage.getItem('ngi_timeline');
      setProperties(storedProps ? JSON.parse(storedProps) : SAMPLE_PROPERTIES);
      setExpenses(storedExp ? JSON.parse(storedExp) : SAMPLE_EXPENSES);
      setTimeline(storedTl ? JSON.parse(storedTl) : SAMPLE_TIMELINE);
    })();
  }, []);

  const saveProperties = useCallback(async (data: Property[]) => {
    await AsyncStorage.setItem('ngi_properties_v2', JSON.stringify(data));
  }, []);
  const saveExpenses = useCallback(async (data: Expense[]) => {
    await AsyncStorage.setItem('ngi_expenses', JSON.stringify(data));
  }, []);
  const saveTimeline = useCallback(async (data: TimelineEvent[]) => {
    await AsyncStorage.setItem('ngi_timeline', JSON.stringify(data));
  }, []);

  const addProperty = useCallback((p: Omit<Property, 'id' | 'createdAt'>) => {
    const newProp: Property = { ...p, id: uid(), createdAt: new Date().toISOString() };
    setProperties((prev) => {
      const next = [newProp, ...prev];
      saveProperties(next);
      return next;
    });
  }, [saveProperties]);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveProperties(next);
      return next;
    });
  }, [saveProperties]);

  const deleteProperty = useCallback((id: string) => {
    setProperties((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveProperties(next);
      return next;
    });
  }, [saveProperties]);

  const addExpense = useCallback((e: Omit<Expense, 'id'>) => {
    const newExp: Expense = { ...e, id: uid() };
    setExpenses((prev) => {
      const next = [newExp, ...prev];
      saveExpenses(next);
      return next;
    });
  }, [saveExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveExpenses(next);
      return next;
    });
  }, [saveExpenses]);

  const addTimelineEvent = useCallback((e: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = { ...e, id: uid() };
    setTimeline((prev) => {
      const next = [newEvent, ...prev];
      saveTimeline(next);
      return next;
    });
  }, [saveTimeline]);

  const addPhoto = useCallback((propertyId: string, photo: Omit<PropertyPhoto, 'id'>) => {
    const newPhoto: PropertyPhoto = { ...photo, id: uid() };
    setProperties((prev) => {
      const next = prev.map((p) =>
        p.id === propertyId
          ? { ...p, propertyPhotos: [...(p.propertyPhotos ?? []), newPhoto] }
          : p,
      );
      saveProperties(next);
      return next;
    });
  }, [saveProperties]);

  const removePhoto = useCallback((propertyId: string, photoId: string) => {
    setProperties((prev) => {
      const next = prev.map((p) =>
        p.id === propertyId
          ? { ...p, propertyPhotos: (p.propertyPhotos ?? []).filter((ph) => ph.id !== photoId) }
          : p,
      );
      saveProperties(next);
      return next;
    });
  }, [saveProperties]);

  const addDocument = useCallback((propertyId: string, doc: Omit<PropertyDocument, 'id'>) => {
    const newDoc: PropertyDocument = { ...doc, id: uid() };
    setProperties((prev) => {
      const next = prev.map((p) =>
        p.id === propertyId
          ? { ...p, documents: [...(p.documents ?? []), newDoc] }
          : p,
      );
      saveProperties(next);
      return next;
    });
  }, [saveProperties]);

  const removeDocument = useCallback((propertyId: string, docId: string) => {
    setProperties((prev) => {
      const next = prev.map((p) =>
        p.id === propertyId
          ? { ...p, documents: (p.documents ?? []).filter((d) => d.id !== docId) }
          : p,
      );
      saveProperties(next);
      return next;
    });
  }, [saveProperties]);

  const getPropertyExpenses = useCallback(
    (propertyId: string) => expenses.filter((e) => e.propertyId === propertyId),
    [expenses],
  );

  const getPropertyTimeline = useCallback(
    (propertyId: string) =>
      timeline.filter((t) => t.propertyId === propertyId).sort((a, b) => b.date.localeCompare(a.date)),
    [timeline],
  );

  const calcNetProfit = useCallback((property: Property): number => {
    if (!property.saleInfo) return 0;
    const { salePrice, sellingClosingCosts, realtorCommission, attorneyFee, lenderPayoff, otherSellingExpenses } = property.saleInfo;
    const propExpenses = expenses.filter((e) => e.propertyId === property.id).reduce((s, e) => s + e.amount, 0);
    return (
      salePrice -
      property.purchasePrice -
      property.closingCosts -
      propExpenses -
      sellingClosingCosts -
      realtorCommission -
      attorneyFee -
      lenderPayoff -
      otherSellingExpenses
    );
  }, [expenses]);

  return (
    <DataContext.Provider value={{
      properties, expenses, timeline,
      addProperty, updateProperty, deleteProperty,
      addExpense, deleteExpense, addTimelineEvent,
      addPhoto, removePhoto, addDocument, removeDocument,
      getPropertyExpenses, getPropertyTimeline, calcNetProfit,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
