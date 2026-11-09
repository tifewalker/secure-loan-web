import type { Fee, GLAccount, GLCategory, Interest } from '@/api';

/** `status` is the source of truth; some records may only carry `isActive`. */
export const isActiveRecord = (r: { status?: string; isActive?: boolean }) =>
  r.status ? r.status === 'active' : !!r.isActive;

export const GL_CATEGORIES: GLCategory[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

/** GL account with the fields the tables rely on filled in. */
export interface GLRow extends GLAccount {
  _id: string;
  glCode: string;
  glName: string;
  accountNumber: string;
  level1Category: GLCategory;
  currency: string;
  isActive: boolean;
}

export const toGLRow = (gl: GLAccount): GLRow => ({
  ...gl,
  _id: gl._id ?? '',
  glCode: gl.glCode ?? '',
  glName: gl.glName ?? '',
  accountNumber: gl.accountNumber ?? '',
  level1Category: gl.level1Category ?? 'Asset',
  currency: gl.currency || 'NGN',
  isActive: isActiveRecord(gl),
});

export const glLabel = (gl?: Pick<GLAccount, 'glCode' | 'glName'>) =>
  gl ? [gl.glCode, gl.glName].filter(Boolean).join(' - ') : '';

/** Looks up GL accounts by `_id` (what fees, interest and products store). */
export const makeGLLookup = (accounts: GLRow[]) => {
  const byId = new Map(accounts.map((a) => [a._id, a]));
  return {
    get: (id?: string) => (id ? byId.get(id) : undefined),
    name: (id?: string) => {
      if (!id) return 'Not set';
      const gl = byId.get(id);
      return gl ? glLabel(gl) : 'Unknown account';
    },
  };
};

export interface FeeRow extends Fee {
  _id: string;
  name: string;
  type: NonNullable<Fee['type']>;
  value: number;
  glAccount: string;
  isActive: boolean;
}

export const toFeeRow = (fee: Fee): FeeRow => ({
  ...fee,
  _id: fee._id ?? '',
  name: fee.name ?? '',
  type: fee.type ?? 'flat',
  value: fee.value ?? 0,
  glAccount: fee.glAccount ?? '',
  isActive: isActiveRecord(fee),
});

export interface InterestRow extends Interest {
  _id: string;
  name: string;
  rate: number;
  rateType: NonNullable<Interest['rateType']>;
  calculationPeriod: NonNullable<Interest['calculationPeriod']>;
  glInterestIncome: string;
  isActive: boolean;
}

export const toInterestRow = (i: Interest): InterestRow => ({
  ...i,
  _id: i._id ?? '',
  name: i.name ?? '',
  rate: i.rate ?? 0,
  rateType: i.rateType ?? 'flat',
  calculationPeriod: i.calculationPeriod ?? 'monthly',
  glInterestIncome: i.glInterestIncome ?? '',
  isActive: isActiveRecord(i),
});
