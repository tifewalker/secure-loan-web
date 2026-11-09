// Shared primitives from the Secure Loan OpenAPI spec (components/schemas).

/** MongoDB ObjectId as a 24-char hex string. */
export type ObjectId = string;

/** ISO 8601 date-time string, e.g. "2026-11-09T10:00:00.000Z". */
export type DateTimeString = string;

/** ISO date string, e.g. "2026-11-09". */
export type DateString = string;

/** `Error` schema — the body of every 4xx/5xx response. */
export interface ApiErrorBody {
  message?: string;
  /** Technical detail (only some endpoints send it). */
  error?: string;
}

/** `Message` schema — the body of most delete / simple success responses. */
export interface MessageResponse {
  message?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface Identification {
  identificationNumber?: string;
  identificationType?: string;
  issueDate?: DateString;
  expiryDate?: DateString;
}

/** Used by tenure, repayment frequency and repayment period. */
export type TimeUnit = 'days' | 'weeks' | 'months' | 'years';

export type ActiveStatus = 'active' | 'inactive';

export interface Pagination {
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

/** Shape of a populated user reference (e.g. `postedBy`, `uploadedBy`). */
export interface UserRef {
  _id?: ObjectId;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}
