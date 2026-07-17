export interface OpeningHour {
  dayOfWeek: number;
  open: string;
  close: string;
}

export interface Court {
  _id: string;
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
  openingHours: OpeningHour[];
  active: boolean;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourtFormData {
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  modalities: string[];
  photos?: string[];
  pricePerHour: number;
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
