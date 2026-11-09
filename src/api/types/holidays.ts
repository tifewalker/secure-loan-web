import type { DateTimeString, ObjectId } from './common';

export interface Holiday {
  _id?: ObjectId;
  name?: string;
  /** YYYY-MM-DD */
  date?: string;
  /** Repeats every year on the same month and day. */
  recurring?: boolean;
  createdBy?: ObjectId;
  createdAt?: DateTimeString;
}

export interface CreateHolidayRequest {
  name: string;
  /** YYYY-MM-DD */
  date: string;
  /** @default false */
  recurring?: boolean;
}

export interface HolidayResponse {
  message?: string;
  holiday?: Holiday;
}

export interface ListHolidaysParams {
  /** Only this year's one-off holidays (recurring ones are always included). */
  year?: string | number;
}

export interface ListHolidaysResponse {
  message?: string;
  holidays?: Holiday[];
}
