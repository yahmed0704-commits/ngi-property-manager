# NGI Property Hub — Google Sheets Backend Plan (V2)

## Overview

V1 (App Store approved May 2026) stores all data locally on the device via AsyncStorage.
V2 will add a secure backend server that syncs data to Google Sheets, enabling:

- Multi-device access (all team members see live data)
- Web + mobile view of the same data
- Export/reporting via Google Sheets formulas and charts
- Accountant access through Sheets without needing the app

---

## Architecture

```
iPhone App (Expo)
      │
      │ HTTPS + Bearer JWT
      ▼
NGI API Server (Node.js / Express)        ← lives on Replit or cloud
      │
      │ Google service account (server-only)
      ▼
Google Sheets (one spreadsheet per company)
      │
      ├── Tab: Properties
      ├── Tab: Expenses
      ├── Tab: Rental Units
      ├── Tab: Rent Payments
      ├── Tab: Maintenance
      └── Tab: Renovation Updates
```

---

## Security Rules

| Item | Where it lives |
|------|---------------|
| Google service account JSON key | Server env var only — never in the mobile app |
| Spreadsheet ID | Server env var only |
| JWT signing secret | Server env var only |
| User credentials | Server database (or replace mock auth with real auth) |

**The mobile app never calls the Google Sheets API directly.**
All writes go through the NGI API server, which validates the user's role before writing.

---

## API Endpoints to Build (Server — `artifacts/api-server`)

### Auth
```
POST /api/auth/login    → { token, user }
POST /api/auth/logout
GET  /api/auth/me       → current user
```

### Properties
```
GET    /api/properties          → list (all roles)
POST   /api/properties          → create (Admin, Partner, PM)
PATCH  /api/properties/:id      → update (Admin, Partner, PM)
DELETE /api/properties/:id      → delete (Admin only)
```

### Expenses
```
GET    /api/expenses?propertyId=...   → list
POST   /api/expenses                   → create (Admin, Partner, PM, Contractor)
PATCH  /api/expenses/:id/approve       → approve (Admin, Partner, Accountant)
DELETE /api/expenses/:id               → delete (Admin only)
```

### Rental
```
GET    /api/rental/units            → list units
POST   /api/rental/units            → create
PATCH  /api/rental/units/:id        → update
GET    /api/rental/payments         → list payments
POST   /api/rental/payments         → record payment
PATCH  /api/rental/payments/:id     → update status
```

### Maintenance
```
GET    /api/maintenance             → list
POST   /api/maintenance             → create
PATCH  /api/maintenance/:id         → update status / assign vendor
```

### Renovation Updates
```
GET    /api/renovation-updates?propertyId=...  → list
POST   /api/renovation-updates                  → create + optional photos
PATCH  /api/renovation-updates/:id              → edit
```

### Uploads (Phase 2)
```
POST   /api/uploads/receipt    → upload receipt photo → returns URL
POST   /api/uploads/photo      → upload property photo → returns URL
```

---

## Google Sheets Structure

### Sheet: Properties
| id | address | city | state | zip | type | status | purchasePrice | closingDate | closingCosts | lenderName | notes | createdAt |

### Sheet: Expenses
| id | propertyId | category | vendor | amount | date | paymentMethod | notes | approvedBy |

### Sheet: Rental Units
| id | address | city | state | tenantName | tenantPhone | monthlyRent | leaseStart | leaseEnd | securityDeposit | status |

### Sheet: Rent Payments
| id | unitId | month | amount | dueDate | paidDate | status |

### Sheet: Maintenance
| id | unitId | title | priority | status | dateSubmitted | dateCompleted | estimatedCost | actualCost | vendor |

---

## Implementation Order

### Step 1 — Replace mock auth with real auth (JWT)
- Add users table or use a service like Clerk
- Issue JWT on login
- Validate JWT in API middleware

### Step 2 — Wire up Sheets API on server
- Create `artifacts/api-server/src/services/sheetsClient.ts`
- Set `GOOGLE_SERVICE_ACCOUNT_KEY` and `SPREADSHEET_ID` as server env vars
- Implement read/write helpers for each sheet tab

### Step 3 — Build CRUD endpoints
- Start with Properties and Expenses (most critical)
- Add Rental + Maintenance next

### Step 4 — Switch mobile app to remote mode
- Set `backendMode: 'sheets'` and `apiBaseUrl: '<server URL>'` in `appConfig.ts`
- All repositories already route correctly — no screen changes needed

### Step 5 — Offline support
- Implement offline queue in `syncManager.ts`
- Retry failed mutations on reconnect

### Step 6 — Photo/receipt uploads
- Implement `POST /api/uploads` on server
- Store to Replit Object Storage
- Write URL into Sheets row

---

## Files Already Ready (V2 scaffold in mobile app)

| File | Purpose |
|------|---------|
| `services/config/appConfig.ts` | Backend mode switch (default: local) |
| `services/storage/asyncStorageAdapter.ts` | Typed AsyncStorage wrapper |
| `services/api/apiClient.ts` | Future HTTP client (auth header TODO) |
| `services/domain/propertyRepository.ts` | Property CRUD (local now, remote later) |
| `services/domain/expenseRepository.ts` | Expense CRUD |
| `services/domain/rentalRepository.ts` | Rental units + payments |
| `services/domain/maintenanceRepository.ts` | Maintenance requests |
| `services/domain/renovationUpdateRepository.ts` | Renovation progress logs |
| `services/sync/syncManager.ts` | Sync orchestration (TODO stubs) |
| `services/sheets/README.ts` | Architecture notes |
| `hooks/usePermissions.ts` | Role-based permission matrix |
| `hooks/useFinancials.ts` | Financial calculation helpers |

---

## What Is NOT Done Yet (before backend connection)

- [ ] Replace mock auth (DEMO_USERS) with real authentication
- [ ] Build JWT middleware on API server
- [ ] Create Google Sheets service account + share spreadsheet with it
- [ ] Implement `sheetsClient.ts` on server
- [ ] Build all API endpoints
- [ ] Implement offline mutation queue in `syncManager.ts`
- [ ] Add bearer token to `apiClient.ts`
- [ ] Set `backendMode: 'sheets'` + `apiBaseUrl` in config
- [ ] Test role enforcement on server (not just client)
- [ ] Android build + Google Play submission
