export interface LookupItem {
  id: number;
  name: string;
  code: string;
}

export interface LookupsResponse {
  subscriberTypes: LookupItem[];
  communicationPreferences: LookupItem[];
  interests: LookupItem[];
}

export interface UpsertSubscriptionRequest {
  firstName: string;
  lastName: string;
  email: string;
  organisation?: string | null;
  subscriberTypeId: number;
  communicationPreferenceIds: number[];
  interestIds: number[];
  phoneNumber?: string | null;
  postalAddress?: string | null;
  consentGiven: boolean;
}

export interface UpsertSubscriptionAck {
  subscriptionId: string;
  correlationId: string;
  timestamp: string;
}

export interface UnsubscribeAck {
  message: string;
  correlationId: string;
  timestamp: string;
}

export interface SubscriptionResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organisation: string | null;
  subscriberType: LookupItem;
  communicationPreferences: LookupItem[];
  interests: LookupItem[];
  phoneNumber: string | null;
  postalAddress: string | null;
  consentGiven: boolean;
  consentTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface SubscriptionFilter {
  searchTerm?: string;
  subscriberTypeId?: number;
  communicationPreferenceId?: number;
  interestId?: number;
  page?: number;
  pageSize?: number;
}

export class ApiError extends Error {
  status: number;
  validationErrors: string[];
  correlationId?: string;

  constructor(
    status: number,
    message: string,
    validationErrors: string[] = [],
    correlationId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
    this.correlationId = correlationId;
  }

  get isValidation() {
    return this.status === 400;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isRateLimited() {
    return this.status === 429;
  }
}
