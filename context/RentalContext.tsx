import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  MaintenanceRequest,
  RentPayment,
  RentalUnit,
} from '@/types';

const SAMPLE_UNITS: RentalUnit[] = [
  {
    id: 'r1',
    address: '156 Willow Drive',
    city: 'Montclair',
    state: 'NJ',
    zip: '07042',
    type: 'Single Family',
    tenantName: 'Marcus & Lisa Johnson',
    tenantPhone: '(973) 555-0182',
    tenantEmail: 'marcus.johnson@email.com',
    monthlyRent: 2650,
    leaseStart: '2025-06-01',
    leaseEnd: '2026-05-31',
    securityDeposit: 2650,
    status: 'Active',
    notes: 'Long-term tenants. Always on time. Dog approved.',
    createdAt: '2025-05-20T10:00:00Z',
  },
  {
    id: 'r2',
    address: '310 Riverside Court – Unit 1',
    city: 'Bloomfield',
    state: 'NJ',
    zip: '07003',
    type: 'Multi-Family',
    tenantName: 'Sandra Rivera',
    tenantPhone: '(973) 555-0247',
    tenantEmail: 'srivera@email.com',
    monthlyRent: 1850,
    leaseStart: '2024-09-01',
    leaseEnd: '2025-08-31',
    securityDeposit: 1850,
    status: 'Ending Soon',
    notes: 'Lease renewal discussion pending.',
    createdAt: '2024-08-15T10:00:00Z',
  },
  {
    id: 'r3',
    address: '310 Riverside Court – Unit 2',
    city: 'Bloomfield',
    state: 'NJ',
    zip: '07003',
    type: 'Multi-Family',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    monthlyRent: 1900,
    leaseStart: '',
    leaseEnd: '',
    securityDeposit: 0,
    status: 'Vacant',
    notes: 'Unit 2 — currently vacant. Freshly painted. Ready to rent.',
    createdAt: '2024-08-15T10:00:00Z',
  },
];

const SAMPLE_PAYMENTS: RentPayment[] = [
  { id: 'rp1', unitId: 'r1', month: '2026-05', amount: 2650, dueDate: '2026-05-01', paidDate: '2026-05-01', status: 'Paid' },
  { id: 'rp2', unitId: 'r1', month: '2026-04', amount: 2650, dueDate: '2026-04-01', paidDate: '2026-04-01', status: 'Paid' },
  { id: 'rp3', unitId: 'r1', month: '2026-03', amount: 2650, dueDate: '2026-03-01', paidDate: '2026-03-02', status: 'Paid' },
  { id: 'rp4', unitId: 'r1', month: '2026-02', amount: 2650, dueDate: '2026-02-01', paidDate: '2026-02-01', status: 'Paid' },
  { id: 'rp5', unitId: 'r1', month: '2026-01', amount: 2650, dueDate: '2026-01-01', paidDate: '2026-01-03', status: 'Paid' },
  { id: 'rp6', unitId: 'r1', month: '2025-12', amount: 2650, dueDate: '2025-12-01', paidDate: '2025-12-01', status: 'Paid' },
  { id: 'rp7', unitId: 'r2', month: '2026-05', amount: 1850, dueDate: '2026-05-01', status: 'Pending' },
  { id: 'rp8', unitId: 'r2', month: '2026-04', amount: 1850, dueDate: '2026-04-01', paidDate: '2026-04-05', status: 'Paid' },
  { id: 'rp9', unitId: 'r2', month: '2026-03', amount: 1850, dueDate: '2026-03-01', paidDate: '2026-03-08', status: 'Late', notes: 'Paid 7 days late' },
  { id: 'rp10', unitId: 'r2', month: '2026-02', amount: 1850, dueDate: '2026-02-01', paidDate: '2026-02-01', status: 'Paid' },
  { id: 'rp11', unitId: 'r2', month: '2026-01', amount: 1850, dueDate: '2026-01-01', paidDate: '2026-01-02', status: 'Paid' },
];

const SAMPLE_MAINTENANCE: MaintenanceRequest[] = [
  {
    id: 'm1',
    unitId: 'r1',
    title: 'Kitchen faucet dripping',
    description: 'Hot water faucet drips constantly.',
    priority: 'Low',
    status: 'Open',
    dateSubmitted: '2026-05-10',
    submittedBy: 'Marcus Johnson',
  },
  {
    id: 'm2',
    unitId: 'r1',
    title: 'HVAC filter replacement',
    description: 'Tenant reported reduced airflow.',
    priority: 'Medium',
    status: 'Completed',
    dateSubmitted: '2026-03-15',
    dateCompleted: '2026-03-18',
    actualCost: 85,
    vendor: 'Quick Fix HVAC',
    submittedBy: 'Jordan Lee',
  },
  {
    id: 'm3',
    unitId: 'r2',
    title: 'Bathroom ceiling water stain',
    description: 'Possible leak from upstairs. Needs inspection.',
    priority: 'High',
    status: 'In Progress',
    dateSubmitted: '2026-04-28',
    estimatedCost: 400,
    vendor: 'NJ Plumbing Pros',
    submittedBy: 'Sandra Rivera',
  },
  {
    id: 'm4',
    unitId: 'r2',
    title: 'Front door lock stiff',
    description: 'Hard to turn key. Needs lubrication or replacement.',
    priority: 'Low',
    status: 'Open',
    dateSubmitted: '2026-05-02',
    submittedBy: 'Sandra Rivera',
  },
];

interface RentalContextType {
  units: RentalUnit[];
  payments: RentPayment[];
  maintenance: MaintenanceRequest[];
  addUnit: (u: Omit<RentalUnit, 'id' | 'createdAt'>) => void;
  updateUnit: (id: string, updates: Partial<RentalUnit>) => void;
  deleteUnit: (id: string) => void;
  addPayment: (p: Omit<RentPayment, 'id'>) => void;
  markPaymentPaid: (id: string, paidDate: string) => void;
  deletePayment: (id: string) => void;
  addMaintenance: (m: Omit<MaintenanceRequest, 'id'>) => void;
  updateMaintenance: (id: string, updates: Partial<MaintenanceRequest>) => void;
  deleteMaintenance: (id: string) => void;
  getUnitPayments: (unitId: string) => RentPayment[];
  getUnitMaintenance: (unitId: string) => MaintenanceRequest[];
}

const RentalContext = createContext<RentalContextType | null>(null);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

export function RentalProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<RentalUnit[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);

  useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem('ngi_rental_units');
      const p = await AsyncStorage.getItem('ngi_rent_payments');
      const m = await AsyncStorage.getItem('ngi_maintenance');
      setUnits(u ? JSON.parse(u) : SAMPLE_UNITS);
      setPayments(p ? JSON.parse(p) : SAMPLE_PAYMENTS);
      setMaintenance(m ? JSON.parse(m) : SAMPLE_MAINTENANCE);
    })();
  }, []);

  const save = useCallback(async (key: string, data: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }, []);

  const addUnit = useCallback((u: Omit<RentalUnit, 'id' | 'createdAt'>) => {
    const n: RentalUnit = { ...u, id: uid(), createdAt: new Date().toISOString() };
    setUnits((prev) => { const next = [n, ...prev]; save('ngi_rental_units', next); return next; });
  }, [save]);

  const updateUnit = useCallback((id: string, updates: Partial<RentalUnit>) => {
    setUnits((prev) => { const next = prev.map((u) => u.id === id ? { ...u, ...updates } : u); save('ngi_rental_units', next); return next; });
  }, [save]);

  const deleteUnit = useCallback((id: string) => {
    setUnits((prev) => { const next = prev.filter((u) => u.id !== id); save('ngi_rental_units', next); return next; });
  }, [save]);

  const addPayment = useCallback((p: Omit<RentPayment, 'id'>) => {
    const n: RentPayment = { ...p, id: uid() };
    setPayments((prev) => { const next = [n, ...prev]; save('ngi_rent_payments', next); return next; });
  }, [save]);

  const markPaymentPaid = useCallback((id: string, paidDate: string) => {
    setPayments((prev) => {
      const next = prev.map((p) => p.id === id ? { ...p, status: 'Paid' as const, paidDate } : p);
      save('ngi_rent_payments', next);
      return next;
    });
  }, [save]);

  const deletePayment = useCallback((id: string) => {
    setPayments((prev) => { const next = prev.filter((p) => p.id !== id); save('ngi_rent_payments', next); return next; });
  }, [save]);

  const addMaintenance = useCallback((m: Omit<MaintenanceRequest, 'id'>) => {
    const n: MaintenanceRequest = { ...m, id: uid() };
    setMaintenance((prev) => { const next = [n, ...prev]; save('ngi_maintenance', next); return next; });
  }, [save]);

  const updateMaintenance = useCallback((id: string, updates: Partial<MaintenanceRequest>) => {
    setMaintenance((prev) => { const next = prev.map((m) => m.id === id ? { ...m, ...updates } : m); save('ngi_maintenance', next); return next; });
  }, [save]);

  const deleteMaintenance = useCallback((id: string) => {
    setMaintenance((prev) => { const next = prev.filter((m) => m.id !== id); save('ngi_maintenance', next); return next; });
  }, [save]);

  const getUnitPayments = useCallback((unitId: string) =>
    payments.filter((p) => p.unitId === unitId).sort((a, b) => b.month.localeCompare(a.month)),
    [payments]);

  const getUnitMaintenance = useCallback((unitId: string) =>
    maintenance.filter((m) => m.unitId === unitId).sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted)),
    [maintenance]);

  return (
    <RentalContext.Provider value={{
      units, payments, maintenance,
      addUnit, updateUnit, deleteUnit,
      addPayment, markPaymentPaid, deletePayment,
      addMaintenance, updateMaintenance, deleteMaintenance,
      getUnitPayments, getUnitMaintenance,
    }}>
      {children}
    </RentalContext.Provider>
  );
}

export function useRental() {
  const ctx = useContext(RentalContext);
  if (!ctx) throw new Error('useRental must be used within RentalProvider');
  return ctx;
}
