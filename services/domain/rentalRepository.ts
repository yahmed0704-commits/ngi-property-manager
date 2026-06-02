import { RentalUnit, RentPayment } from '@/types';
import appConfig from '../config/appConfig';
import { storage } from '../storage/asyncStorageAdapter';

const UNITS_KEY = 'ngi_rental_units';
const PAYMENTS_KEY = 'ngi_rent_payments';

/**
 * Rental repository — local mode now, remote mode later.
 *
 * Covers RentalUnits and RentPayments. MaintenanceRequests have their own repo.
 *
 * TODO (V2 backend): Wire remote branches:
 *   GET  /api/rental/units          → list all units
 *   POST /api/rental/units          → create unit
 *   PATCH /api/rental/units/:id     → update unit (lease renewal, tenant info)
 *   DELETE /api/rental/units/:id    → delete unit
 *   GET  /api/rental/payments       → list payments
 *   POST /api/rental/payments       → record payment
 *   PATCH /api/rental/payments/:id  → mark paid / update status
 */
export const rentalRepository = {
  units: {
    async getAll(): Promise<RentalUnit[]> {
      if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
        // TODO (V2 backend): return apiRequest<RentalUnit[]>('/api/rental/units');
      }
      return (await storage.get<RentalUnit[]>(UNITS_KEY)) ?? [];
    },

    async save(units: RentalUnit[]): Promise<void> {
      await storage.set(UNITS_KEY, units);
    },

    async create(unit: RentalUnit): Promise<RentalUnit> {
      const all = await this.getAll();
      await storage.set(UNITS_KEY, [...all, unit]);
      return unit;
    },

    async update(id: string, changes: Partial<RentalUnit>): Promise<RentalUnit | null> {
      const all = await this.getAll();
      const idx = all.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...changes };
      await storage.set(UNITS_KEY, all);
      return all[idx];
    },

    async delete(id: string): Promise<void> {
      const all = await this.getAll();
      await storage.set(UNITS_KEY, all.filter((u) => u.id !== id));
    },
  },

  payments: {
    async getAll(): Promise<RentPayment[]> {
      if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
        // TODO (V2 backend): return apiRequest<RentPayment[]>('/api/rental/payments');
      }
      return (await storage.get<RentPayment[]>(PAYMENTS_KEY)) ?? [];
    },

    async getByUnit(unitId: string): Promise<RentPayment[]> {
      const all = await this.getAll();
      return all.filter((p) => p.unitId === unitId);
    },

    async save(payments: RentPayment[]): Promise<void> {
      await storage.set(PAYMENTS_KEY, payments);
    },

    async create(payment: RentPayment): Promise<RentPayment> {
      const all = await this.getAll();
      await storage.set(PAYMENTS_KEY, [...all, payment]);
      return payment;
    },

    async update(id: string, changes: Partial<RentPayment>): Promise<RentPayment | null> {
      const all = await this.getAll();
      const idx = all.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...changes };
      await storage.set(PAYMENTS_KEY, all);
      return all[idx];
    },
  },
};
