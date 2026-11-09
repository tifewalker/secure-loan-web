import type { Address, DateString, DateTimeString, Identification, ObjectId, UserRef } from './common';

export type CustomerTitle = 'Mr' | 'Mrs' | 'Miss' | 'Dr';
export type EmploymentStatus = 'employed' | 'self-employed' | 'unemployed' | 'student' | 'retired';
export type BankAccountType = 'savings' | 'current';
export type CustomerStatus = 'active' | 'pending' | 'inactive';

/** Customer as returned by the API (nested). */
export interface Customer {
  _id?: ObjectId;
  /** Generated on creation, e.g. `CUSTA1B2C`. */
  customerId?: string;
  title?: CustomerTitle;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: Address;
  meansOfIdentification?: Identification;
  employmentDetails?: {
    employerName?: string;
    jobTitle?: string;
    employmentType?: string;
    monthlyIncome?: number;
    employmentStartDate?: DateString;
    Occupation?: string;
    employmentAddress?: Address;
  };
  nextOfKin?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    address?: Address;
    identification?: Identification;
  };
  bankingDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    accountType?: BankAccountType;
  };
  guarantor?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    address?: string;
    identification?: Identification;
  };
  employmentStatus?: EmploymentStatus;
  income?: number;
  status?: CustomerStatus;
  isActive?: boolean;
  createdAt?: DateTimeString;
}

/**
 * `CustomerInput` — flat request body. The API nests these into address,
 * employment, next-of-kin, banking and guarantor details.
 */
export interface CustomerInput {
  title?: CustomerTitle;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  /** Must be unique across customers. */
  identificationNumber?: string;
  identificationType?: string;
  issueDate?: DateString;
  expiryDate?: DateString;
  employmentStatus?: EmploymentStatus;
  employerName?: string;
  jobTitle?: string;
  employmentType?: string;
  monthlyIncome?: number;
  employmentStartDate?: DateString;
  Occupation?: string;
  employmentStreet?: string;
  employmentCity?: string;
  employmentState?: string;
  employmentCountry?: string;
  employmentZipCode?: string;
  income?: number;
  kinName?: string;
  relationship?: string;
  kinPhone?: string;
  kinEmail?: string;
  kinStreet?: string;
  kinCity?: string;
  kinState?: string;
  kinCountry?: string;
  kinZipCode?: string;
  kinIdentificationNumber?: string;
  kinIdentificationType?: string;
  kinIssueDate?: DateString;
  kinExpiryDate?: DateString;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  accountType?: BankAccountType;
  guarantorName?: string;
  guarantorRelationship?: string;
  guarantorPhone?: string;
  guarantorEmail?: string;
  guarantorIdentificationNumber?: string;
  guarantorIdentificationType?: string;
  guarantorIssueDate?: DateString;
  guarantorExpiryDate?: DateString;
}

/** `POST /api/customers/create`. Email and phone number must be unique. */
export interface CreateCustomerRequest extends CustomerInput {
  title: CustomerTitle;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  /** Guarantor address. */
  guarantorStreet?: string;
  /** @default "inactive" */
  status?: CustomerStatus;
  /** @default false */
  isActive?: boolean;
}

/** `PUT /api/customers/update/{id}`. Only the fields sent are changed. */
export interface UpdateCustomerRequest extends CustomerInput {
  /** Guarantor address (note: `guarantorStreet` on create, `guarantorAddress` here). */
  guarantorAddress?: string;
}

export interface CustomerResponse {
  message?: string;
  customer?: Customer;
}

/** `GET /api/customers/{id}` returns the customer under `user`. */
export interface GetCustomerResponse {
  user?: Customer;
}

export interface ListCustomersResponse {
  message?: string;
  customers?: Customer[];
}

export interface ToggleCustomerResponse {
  message?: string;
  status?: 'active' | 'inactive';
  isActive?: boolean;
}

// ---------- Wallets ----------

export interface Wallet {
  _id?: ObjectId;
  userId?: ObjectId;
  customerId?: string;
  walletAccountNumber?: string;
  walletName?: string;
  /** Overpayments waiting to be applied to future instalments. */
  balance?: number;
  currency?: string;
  type?: 'user' | 'system' | 'charges' | 'gl';
  lastTransaction?: DateTimeString;
  lastTransactionAmount?: number;
  lastTransactionType?: 'credit' | 'debit';
}

// ---------- Documents ----------

export type DocumentType =
  | 'passport_photograph'
  | 'signature'
  | 'nin'
  | 'international_passport'
  | 'drivers_license'
  | 'government_id'
  | 'proof_of_address'
  | 'proof_of_income'
  | 'bank_statement'
  | 'employment_evidence'
  | 'bvn_verification'
  | 'kyc_evidence'
  | 'guarantor_id'
  | 'guarantor_document'
  | 'collateral_document'
  | 'loan_agreement';

export type DocumentMimeType = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';

export interface CustomerDocument {
  _id?: ObjectId;
  customerId?: ObjectId;
  loanId?: ObjectId;
  documentType?: DocumentType;
  description?: string;
  originalName?: string;
  mimeType?: DocumentMimeType;
  /** Bytes. */
  size?: number;
  /** SHA-256 of the file. */
  checksum?: string;
  uploadedBy?: UserRef;
  status?: 'active' | 'deleted';
  createdAt?: DateTimeString;
}

export interface DocumentTypesResponse {
  types?: { value?: DocumentType; label?: string; requiresLoan?: boolean }[];
  maxFileSizeMB?: number;
  allowedFormats?: string[];
}

/** Sent as multipart/form-data. One file per request, up to 10 MB. */
export interface UploadDocumentRequest {
  file: File | Blob;
  documentType: DocumentType;
  /** Required for `collateral_document` and `loan_agreement`. */
  loanId?: ObjectId;
  description?: string;
}

export interface UploadDocumentResponse {
  message?: string;
  document?: CustomerDocument;
}

export interface ListDocumentsParams {
  documentType?: DocumentType;
  loanId?: ObjectId;
}

export interface ListDocumentsResponse {
  message?: string;
  documents?: CustomerDocument[];
}

export interface DocumentDownloadParams {
  /** true opens in the browser instead of downloading. */
  inline?: boolean;
}

export interface DocumentDownloadResponse {
  /** Signed link, expires after 5 minutes. */
  url?: string;
  expiresInSeconds?: number;
}

export interface DeleteDocumentRequest {
  reason: string;
}
