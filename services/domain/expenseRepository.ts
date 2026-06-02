import { Expense } from '@/types';
import appConfig from '../config/appConfig';
import { storage } from '../storage/asyncStorageAdapter';

const LOCAL_KEY = 'ngi_expenses_v1';

/**
 * Expense repository — local mode now, remote mode later.
 *
 * Expenses are stored flat and filtered by propertyId on the client.
 * The API server will handle server-side filtering by propertyId and role.
 *
 * TODO (V2 backend): Wire remote branches:
 *   GET  /api/expenses?propertyId=...  → list
 *   POST /api/expenses                  → create (with optional receipt photo URL)
 *   PATCH /api/expenses/:id            → update
 *   DELETE /api/expenses/:id           → delete
 *   POST /api/expenses/:id/approve     → approve (Admin/Accountant only)
 */
export const expenseRepository = {
  async getAll(): Promise<Expense[]> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): return apiRequest<Expense[]>('/api/expenses');
    }
    return (await storage.get<Expense[]>(LOCAL_KEY)) ?? [];
  },

  async getByProperty(propertyId: string): Promise<Expense[]> {
    const all = await this.getAll();
    return all.filter((e) => e.propertyId === propertyId);
  },

  async save(expenses: Expense[]): Promise<void> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): bulk save via API
      return;
    }
    await storage.set(LOCAL_KEY, expenses);
  },

  async create(expense: Expense): Promise<Expense> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): return apiRequest<Expense>('/api/expenses', { method: 'POST', body: expense });
    }
    const all = await this.getAll();
    await storage.set(LOCAL_KEY, [...all, expense]);
    return expense;
  },

  async delete(id: string): Promise<void> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): await apiRequest<void>(`/api/expenses/${id}`, { method: 'DELETE' });
      return;
    }
    const all = await this.getAll();
    await storage.set(LOCAL_KEY, all.filter((e) => e.id !== id));
  },
};
