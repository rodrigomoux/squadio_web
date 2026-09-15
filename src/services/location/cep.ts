export type CepAddress = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  /** Endereço formatado pronto para o formulário (sem número). */
  formatted: string;
};

type ViaCepResponse = {
  erro?: boolean | string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Busca endereço no ViaCEP.
 * @see https://viacep.com.br/
 */
export async function lookupCep(cepInput: string): Promise<CepAddress> {
  const cep = onlyDigits(cepInput);
  if (cep.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos");
  }

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error("Falha ao consultar o CEP");
  }

  const data = (await res.json()) as ViaCepResponse;
  if (data.erro === true || data.erro === "true") {
    throw new Error("CEP não encontrado");
  }

  const street = (data.logradouro || "").trim();
  const neighborhood = (data.bairro || "").trim();
  const city = (data.localidade || "").trim();
  const state = (data.uf || "").trim();
  const parts = [street, neighborhood, city && state ? `${city} - ${state}` : city || state]
    .filter(Boolean);

  return {
    cep: formatCep(cep),
    street,
    neighborhood,
    city,
    state,
    formatted: parts.join(", "),
  };
}

/**
 * Geocodifica endereço via proxy Next (/api/geocode → Nominatim).
 * Retorna null se não achar — o usuário ainda pode ajustar manualmente.
 */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = address.trim();
  if (!q) return null;

  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { lat?: number | null; lng?: number | null };
  if (
    data.lat == null ||
    data.lng == null ||
    !Number.isFinite(data.lat) ||
    !Number.isFinite(data.lng)
  ) {
    return null;
  }
  return { lat: data.lat, lng: data.lng };
}
