export interface OpeningHour {
  dayOfWeek: number;
  open: string;
  close: string;
}

export type BankHolderType = "individual" | "company";
export type BankAccountType = "checking" | "savings";

export interface EstablishmentBankAccount {
  holderName: string;
  holderType: BankHolderType;
  holderDocument: string;
  email: string;
  bank: string;
  branchNumber: string;
  branchCheckDigit?: string;
  accountNumber: string;
  accountCheckDigit: string;
  accountType: BankAccountType;
}

export interface Establishment {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  address: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  photos: string[];
  bankAccount?: EstablishmentBankAccount;
  pagarmeRecipientId?: string;
  pagarmeRecipientStatus?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstablishmentFormData {
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  photos?: string[];
  bankAccount?: EstablishmentBankAccount;
}

export interface Court {
  _id: string;
  establishmentId?: string;
  establishment?: { _id: string; name: string };
  ownerId: string;
  name: string;
  description?: string;
  address: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  modalities: string[];
  photos: string[];
  pricePerHour: number;
  /** Quadra pública: horários + chat por slot, sem reserva */
  isPublic?: boolean;
  /** Comandas do app ativas no PDV / loja no app */
  comandasEnabled?: boolean;
  openingHours: OpeningHour[];
  active: boolean;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourtFormData {
  establishmentId: string;
  name: string;
  description?: string;
  modalities: string[];
  photos?: string[];
  pricePerHour: number;
  isPublic?: boolean;
  comandasEnabled?: boolean;
  openingHours: OpeningHour[];
}

export interface Reservation {
  _id: string;
  courtId: string;
  userId: string;
  startAt: string;
  endAt: string;
  status: string;
  totalPrice: number;
  notes?: string;
  createdAt?: string;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface Product {
  _id: string;
  courtId: string;
  name: string;
  description?: string;
  price: number;
  photoUrl?: string;
  stock?: number | null;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  name?: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  _id: string;
  userId: string;
  courtId: string;
  reservationId?: string;
  items: OrderItem[];
  status: string;
  source?: "app" | "pos";
  fulfillmentStatus?: "pending" | "delivered";
  deliveredAt?: string;
  userName?: string;
  userEmail?: string;
  courtName?: string;
  totalAmount: number;
  paymentProvider?: string;
  paymentExternalId?: string;
  createdAt?: string;
}

export interface Team {
  _id: string;
  name: string;
  modality: string;
  ownerId: string;
  memberIds: string[];
}

export interface Championship {
  _id: string;
  name: string;
  modality: string;
  format: string;
  scope: string;
  organizerId: string;
  courtId?: string;
  teamIds: string[];
  status: string;
  startDate?: string;
  endDate?: string;
}

export interface Match {
  _id: string;
  championshipId: string;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  round: number;
  roundLabel?: string;
  bracketSlot?: number;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  winnerTeamId?: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface SystemApiKeysForm {
  mapsApiKey: string;
  paymentApiKey: string;
  paymentSecretKey: string;
  emailApiKey: string;
  firebaseServerKey: string;
  custom: Record<string, string>;
}

export interface SystemWhatsAppConfig {
  enabled: boolean;
  metaPhoneNumberId: string;
  metaBusinessAccountId: string;
  metaAccessToken: string;
  metaVerifyToken: string;
  metaAppSecret: string;
}

export interface SystemAiConfig {
  provider: "gemini" | "grok";
  geminiApiKey: string;
  grokApiKey: string;
  modelGemini: string;
  modelGrok: string;
  systemPrompt: string;
}

export interface SystemPaymentsConfig {
  enabled: boolean;
  secretKey: string;
  publicKey: string;
  platformRecipientId: string;
  platformFeePercent: number;
  pagarmeFeePercent: number;
}

export interface PaymentFeesPreview {
  enabled: boolean;
  platformFeePercent: number;
  pagarmeFeePercent: number;
  platformRecipientConfigured: boolean;
  preview: {
    amountReais: number;
    grossCents: number;
    platformFeeCents: number;
    pagarmeFeeCents: number;
    recipientCents: number;
    platformTotalCents: number;
    platformFeeReais: number;
    pagarmeFeeReais: number;
    recipientReais: number;
    platformTotalReais: number;
  };
}

export interface SystemConfig {
  establishmentDuplicateCheckEnabled: boolean;
  establishmentDuplicateRadiusMeters: number;
  appName: string;
  supportEmail: string;
  apiKeys: SystemApiKeysForm;
  apiKeysConfigured: {
    mapsApiKey: boolean;
    paymentApiKey: boolean;
    paymentSecretKey: boolean;
    emailApiKey: boolean;
    firebaseServerKey: boolean;
  };
  whatsapp: SystemWhatsAppConfig;
  whatsappConfigured: {
    metaAccessToken: boolean;
    metaVerifyToken: boolean;
    metaAppSecret: boolean;
    metaPhoneNumberId: boolean;
  };
  ai: SystemAiConfig;
  aiConfigured: {
    geminiApiKey: boolean;
    grokApiKey: boolean;
  };
  payments: SystemPaymentsConfig;
  paymentsConfigured: {
    secretKey: boolean;
    publicKey: boolean;
  };
  updatedAt?: string;
}

export type SystemConfigPatch = {
  establishmentDuplicateCheckEnabled?: boolean;
  establishmentDuplicateRadiusMeters?: number;
  appName?: string;
  supportEmail?: string;
  apiKeys?: Partial<SystemApiKeysForm>;
  whatsapp?: Partial<SystemWhatsAppConfig>;
  ai?: Partial<SystemAiConfig>;
  payments?: Partial<SystemPaymentsConfig>;
};
