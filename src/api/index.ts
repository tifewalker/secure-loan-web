/**
 * Typed API layer generated from the Secure Loan OpenAPI spec
 * (https://peak-financials-backend.onrender.com/swagger-docs/).
 *
 *   import { useCustomers, useBookLoan, type Loan } from '@/api';
 *
 * - `types/`     request/response shapes, one file per domain
 * - `endpoints/` plain async functions, one per endpoint (usable outside React)
 * - `hooks/`     TanStack Query hooks; queries unwrap the payload, mutations
 *                return the full response (for `message`) and invalidate caches
 */
export * from './client';
export * from './types';
export * from './endpoints';
export * from './hooks';
