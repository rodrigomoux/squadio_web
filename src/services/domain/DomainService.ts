import { apiFetch } from "@/lib/api/apiFetch";
import type {
  ApiEnvelope,
  AvailabilitySlot,
  Championship,
  Court,
  CourtFormData,
  Establishment,
  EstablishmentFormData,
  Match,
  Order,
  Product,
  Reservation,
  SystemConfig,
  SystemConfigPatch,
  Team,
} from "@/lib/domain/types";

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(
      `Resposta vazia do BFF (${response.status}). Verifique se a API está no ar e NEXT_PUBLIC_API_URL.`,
    );
  }

  let body: ApiEnvelope<T> & { error?: string; message?: string };
  try {
    body = JSON.parse(text) as ApiEnvelope<T> & {
      error?: string;
      message?: string;
    };
  } catch {
    throw new Error(`Resposta inválida do BFF: ${text.slice(0, 120)}`);
  }

  if (!response.ok || body.success === false) {
    throw new Error(body.error ?? body.message ?? "Erro na requisição");
  }

  if (body.data === undefined || body.data === null) {
    throw new Error(body.error ?? "Resposta sem dados");
  }

  return body.data;
}

export type MediaUploadResult = {
  url: string;
  thumbUrl: string;
  full: string;
  thumb?: string;
  host: string;
  name: string;
  extension: string;
  id?: string;
};

export class MediaService {
  static async uploadBase64(base64: string): Promise<MediaUploadResult> {
    const data = await parse<{ media: MediaUploadResult }>(
      await apiFetch("/api/media/upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      }),
    );
    return data.media;
  }
}

export class EstablishmentsService {
  static async list(params?: { ownerId?: string }): Promise<Establishment[]> {
    const qs = new URLSearchParams();
    if (params?.ownerId) qs.set("ownerId", params.ownerId);
    const suffix = qs.toString() ? `?${qs}` : "";
    const data = await parse<{ establishments: Establishment[] }>(
      await apiFetch(`/api/establishments${suffix}`, { credentials: "include" }),
    );
    return data.establishments ?? [];
  }

  static async get(id: string): Promise<Establishment> {
    const data = await parse<{ establishment: Establishment }>(
      await apiFetch(`/api/establishments/${id}`, { credentials: "include" }),
    );
    return data.establishment;
  }

  static async create(payload: EstablishmentFormData): Promise<Establishment> {
    const data = await parse<{ establishment: Establishment }>(
      await apiFetch("/api/establishments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.establishment;
  }

  static async update(
    id: string,
    payload: Partial<EstablishmentFormData>,
  ): Promise<Establishment> {
    const data = await parse<{ establishment: Establishment }>(
      await apiFetch(`/api/establishments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.establishment;
  }

  static async remove(id: string): Promise<void> {
    await parse(
      await apiFetch(`/api/establishments/${id}`, {
        method: "DELETE",
        credentials: "include",
      }),
    );
  }
}

export class CourtsService {
  static async list(params?: {
    modality?: string;
    ownerId?: string;
    establishmentId?: string;
  }): Promise<Court[]> {
    const qs = new URLSearchParams();
    if (params?.modality) qs.set("modality", params.modality);
    if (params?.ownerId) qs.set("ownerId", params.ownerId);
    if (params?.establishmentId) qs.set("establishmentId", params.establishmentId);
    const suffix = qs.toString() ? `?${qs}` : "";
    const data = await parse<{ courts: Court[] }>(
      await apiFetch(`/api/courts${suffix}`, { credentials: "include" }),
    );
    return data.courts ?? [];
  }

  static async get(id: string): Promise<Court> {
    const data = await parse<{ court: Court }>(
      await apiFetch(`/api/courts/${id}`, { credentials: "include" }),
    );
    return data.court;
  }

  static async create(payload: CourtFormData): Promise<Court> {
    const data = await parse<{ court: Court }>(
      await apiFetch("/api/courts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.court;
  }

  static async update(id: string, payload: Partial<CourtFormData>): Promise<Court> {
    const data = await parse<{ court: Court }>(
      await apiFetch(`/api/courts/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.court;
  }

  static async remove(id: string): Promise<void> {
    await parse(
      await apiFetch(`/api/courts/${id}`, {
        method: "DELETE",
        credentials: "include",
      }),
    );
  }

  static async availability(id: string, date: string): Promise<AvailabilitySlot[]> {
    const data = await parse<{ slots: AvailabilitySlot[] }>(
      await apiFetch(
        `/api/courts/${id}/availability?date=${encodeURIComponent(date)}`,
        { credentials: "include" },
      ),
    );
    return data.slots ?? [];
  }
}

export class ReservationsService {
  static async list(params?: {
    courtId?: string;
    from?: string;
    to?: string;
    mine?: boolean;
  }): Promise<Reservation[]> {
    const qs = new URLSearchParams();
    if (params?.courtId) qs.set("courtId", params.courtId);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.mine === false) qs.set("mine", "false");
    const suffix = qs.toString() ? `?${qs}` : "";
    const data = await parse<{ reservations: Reservation[] }>(
      await apiFetch(`/api/reservations${suffix}`, { credentials: "include" }),
    );
    return data.reservations ?? [];
  }

  static async create(payload: {
    courtId: string;
    startAt: string;
    endAt: string;
    notes?: string;
    userId?: string;
  }): Promise<Reservation> {
    const data = await parse<{ reservation: Reservation }>(
      await apiFetch("/api/reservations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.reservation;
  }

  static async cancel(id: string): Promise<void> {
    await parse(
      await apiFetch(`/api/reservations/${id}/cancel`, {
        method: "POST",
        credentials: "include",
      }),
    );
  }
}

export class ProductsService {
  static async list(params?: { courtId?: string; all?: boolean }): Promise<Product[]> {
    const qs = new URLSearchParams();
    if (params?.courtId) qs.set("courtId", params.courtId);
    if (params?.all) qs.set("all", "true");
    const suffix = qs.toString() ? `?${qs}` : "";
    const data = await parse<{ products: Product[] }>(
      await apiFetch(`/api/products${suffix}`, { credentials: "include" }),
    );
    return data.products ?? [];
  }

  static async create(payload: {
    courtId: string;
    name: string;
    description?: string;
    price: number;
    photoUrl?: string;
    stock?: number | null;
  }): Promise<Product> {
    const data = await parse<{ product: Product }>(
      await apiFetch("/api/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.product;
  }

  static async update(
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      price: number;
      photoUrl: string;
      stock: number | null;
      active: boolean;
    }>,
  ): Promise<Product> {
    const data = await parse<{ product: Product }>(
      await apiFetch(`/api/products/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.product;
  }

  static async remove(id: string): Promise<void> {
    await parse(
      await apiFetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      }),
    );
  }
}

export class OrdersService {
  static async list(params?: {
    courtId?: string;
    mine?: boolean;
    status?: string;
  }): Promise<Order[]> {
    const qs = new URLSearchParams();
    if (params?.courtId) qs.set("courtId", params.courtId);
    if (params?.mine === false) qs.set("mine", "false");
    if (params?.status) qs.set("status", params.status);
    const suffix = qs.toString() ? `?${qs}` : "";
    const data = await parse<{ orders: Order[] }>(
      await apiFetch(`/api/orders${suffix}`, { credentials: "include" }),
    );
    return data.orders ?? [];
  }

  static async create(payload: {
    courtId: string;
    items: Array<{ productId: string; quantity: number }>;
    reservationId?: string;
    payNow?: boolean;
  }): Promise<Order> {
    const data = await parse<{ order: Order }>(
      await apiFetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.order;
  }
}

export class ChampionshipsService {
  static async list(params?: {
    scope?: string;
    modality?: string;
    organizerId?: string;
  }): Promise<Championship[]> {
    const qs = new URLSearchParams();
    if (params?.scope) qs.set("scope", params.scope);
    if (params?.modality) qs.set("modality", params.modality);
    if (params?.organizerId) qs.set("organizerId", params.organizerId);
    const suffix = qs.toString() ? `?${qs}` : "";
    const data = await parse<{ championships: Championship[] }>(
      await apiFetch(`/api/championships${suffix}`, { credentials: "include" }),
    );
    return data.championships ?? [];
  }

  static async create(payload: {
    name: string;
    modality: string;
    format: string;
    scope?: string;
    courtId?: string;
  }): Promise<Championship> {
    const data = await parse<{ championship: Championship }>(
      await apiFetch("/api/championships", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.championship;
  }

  static async detail(id: string): Promise<{
    championship: Championship;
    matches: Match[];
    teams: Team[];
  }> {
    return parse(
      await apiFetch(`/api/championships/${id}`, { credentials: "include" }),
    );
  }

  static async joinTeam(id: string, teamId: string): Promise<Championship> {
    const data = await parse<{ championship: Championship }>(
      await apiFetch(`/api/championships/${id}/teams`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      }),
    );
    return data.championship;
  }

  static async generateBracket(id: string) {
    return parse(
      await apiFetch(`/api/championships/${id}/generate-bracket`, {
        method: "POST",
        credentials: "include",
      }),
    );
  }

  static async reportScore(
    matchId: string,
    payload: { homeScore: number; awayScore: number; autoConfirm?: boolean },
  ): Promise<Match> {
    const data = await parse<{ match: Match }>(
      await apiFetch(`/api/matches/${matchId}/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.match;
  }
}

export class TeamsService {
  static async listMine(): Promise<Team[]> {
    const data = await parse<{ teams: Team[] }>(
      await apiFetch("/api/teams?mine=true", { credentials: "include" }),
    );
    return data.teams ?? [];
  }

  static async create(payload: {
    name: string;
    modality: string;
  }): Promise<Team> {
    const data = await parse<{ team: Team }>(
      await apiFetch("/api/teams", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.team;
  }
}

export class SystemConfigService {
  static async get(): Promise<SystemConfig> {
    const data = await parse<{ config: SystemConfig }>(
      await apiFetch("/api/system-config"),
    );
    return data.config;
  }

  static async update(payload: SystemConfigPatch): Promise<SystemConfig> {
    const data = await parse<{ config: SystemConfig }>(
      await apiFetch("/api/system-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    return data.config;
  }
}
