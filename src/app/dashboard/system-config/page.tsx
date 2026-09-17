"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  fieldClass,
  labelClass,
  PageHeader,
} from "@/components/ui/PageHeader";
import type { SystemConfig } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import { SystemConfigService } from "@/services/domain/DomainService";

export default function SystemConfigPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SystemConfigService.get();
      setConfig({
        ...data,
        payments: data.payments ?? {
          enabled: false,
          secretKey: "",
          publicKey: "",
          platformRecipientId: "",
          platformFeePercent: 0,
          pagarmeFeePercent: 0,
        },
        paymentsConfigured: data.paymentsConfigured ?? {
          secretKey: false,
          publicKey: false,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    void load();
  }, [authLoading, isAdmin, load, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await SystemConfigService.update({
        establishmentDuplicateCheckEnabled:
          config.establishmentDuplicateCheckEnabled,
        establishmentDuplicateRadiusMeters:
          config.establishmentDuplicateRadiusMeters,
        appName: config.appName,
        supportEmail: config.supportEmail,
        apiKeys: {
          mapsApiKey: config.apiKeys.mapsApiKey,
          emailApiKey: config.apiKeys.emailApiKey,
          firebaseServerKey: config.apiKeys.firebaseServerKey,
        },
        whatsapp: { ...config.whatsapp },
        ai: { ...config.ai },
        payments: { ...config.payments },
      });
      setConfig(updated);
      setSuccess("Configurações salvas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || (!isAdmin && !error)) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-sm text-slate-500">
        Verificando permissões…
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Configurações do sistema"
        description="Ajustes globais, WhatsApp, IA, Pagar.me e chaves de API. Apenas admin master."
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      {loading || !config ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-8">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Geral
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelClass}>Nome do app</span>
                <input
                  className={fieldClass}
                  value={config.appName}
                  onChange={(e) =>
                    setConfig({ ...config, appName: e.target.value })
                  }
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelClass}>E-mail de suporte</span>
                <input
                  type="email"
                  className={fieldClass}
                  value={config.supportEmail}
                  onChange={(e) =>
                    setConfig({ ...config, supportEmail: e.target.value })
                  }
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Localidades — anti-duplicidade
            </h2>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={config.establishmentDuplicateCheckEnabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    establishmentDuplicateCheckEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-[#2563eb]"
              />
              Ativar validação de localidades próximas
            </label>
            <label className="block max-w-xs">
              <span className={labelClass}>Raio (metros)</span>
              <input
                type="number"
                min={5}
                max={5000}
                className={fieldClass}
                value={config.establishmentDuplicateRadiusMeters}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    establishmentDuplicateRadiusMeters: Number(e.target.value),
                  })
                }
              />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              WhatsApp (Meta Cloud API)
            </h2>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={config.whatsapp.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    whatsapp: { ...config.whatsapp, enabled: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-[#2563eb]"
              />
              Habilitar canal WhatsApp
            </label>
            <label className="block">
              <span className={labelClass}>Phone Number ID</span>
              <input
                className={fieldClass}
                value={config.whatsapp.metaPhoneNumberId}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    whatsapp: {
                      ...config.whatsapp,
                      metaPhoneNumberId: e.target.value,
                    },
                  })
                }
              />
            </label>
            <label className="block">
              <span className={labelClass}>Business Account ID</span>
              <input
                className={fieldClass}
                value={config.whatsapp.metaBusinessAccountId}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    whatsapp: {
                      ...config.whatsapp,
                      metaBusinessAccountId: e.target.value,
                    },
                  })
                }
              />
            </label>
            {(
              [
                ["metaAccessToken", "Access Token", "metaAccessToken"],
                ["metaVerifyToken", "Verify Token (webhook)", "metaVerifyToken"],
                ["metaAppSecret", "App Secret (assinatura)", "metaAppSecret"],
              ] as const
            ).map(([field, label, configuredKey]) => (
              <label key={field} className="block">
                <span className={labelClass}>
                  {label}
                  {config.whatsappConfigured[configuredKey] ? (
                    <span className="ml-2 text-xs font-normal text-emerald-600">
                      configurada
                    </span>
                  ) : null}
                </span>
                <input
                  type="password"
                  autoComplete="off"
                  className={fieldClass}
                  value={config.whatsapp[field]}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      whatsapp: {
                        ...config.whatsapp,
                        [field]: e.target.value,
                      },
                    })
                  }
                />
              </label>
            ))}
            <p className="text-xs text-slate-500">
              Webhook:{" "}
              <code className="rounded bg-slate-100 px-1">
                GET/POST /webhooks/whatsapp
              </code>
            </p>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Inteligência artificial
            </h2>
            <label className="block max-w-xs">
              <span className={labelClass}>Provedor ativo</span>
              <select
                className={fieldClass}
                value={config.ai.provider}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    ai: {
                      ...config.ai,
                      provider: e.target.value as "gemini" | "grok",
                    },
                  })
                }
              >
                <option value="gemini">Gemini</option>
                <option value="grok">Grok (xAI)</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>
                Gemini API Key
                {config.aiConfigured.geminiApiKey ? (
                  <span className="ml-2 text-xs font-normal text-emerald-600">
                    configurada
                  </span>
                ) : null}
              </span>
              <input
                type="password"
                className={fieldClass}
                value={config.ai.geminiApiKey}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    ai: { ...config.ai, geminiApiKey: e.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className={labelClass}>Modelo Gemini</span>
              <input
                className={fieldClass}
                value={config.ai.modelGemini}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    ai: { ...config.ai, modelGemini: e.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className={labelClass}>
                Grok API Key
                {config.aiConfigured.grokApiKey ? (
                  <span className="ml-2 text-xs font-normal text-emerald-600">
                    configurada
                  </span>
                ) : null}
              </span>
              <input
                type="password"
                className={fieldClass}
                value={config.ai.grokApiKey}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    ai: { ...config.ai, grokApiKey: e.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className={labelClass}>Modelo Grok</span>
              <input
                className={fieldClass}
                value={config.ai.modelGrok}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    ai: { ...config.ai, modelGrok: e.target.value },
                  })
                }
              />
            </label>
            <label className="block">
              <span className={labelClass}>System prompt</span>
              <textarea
                rows={4}
                className={fieldClass}
                value={config.ai.systemPrompt}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    ai: { ...config.ai, systemPrompt: e.target.value },
                  })
                }
              />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pagar.me / Pagamentos
            </h2>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={config.payments?.enabled ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    payments: {
                      ...config.payments,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-[#2563eb]"
              />
              Habilitar pagamentos Pagar.me com split
            </label>
            <label className="block">
              <span className={labelClass}>
                Secret Key (sk_…)
                {config.paymentsConfigured?.secretKey ? (
                  <span className="ml-2 text-xs font-normal text-emerald-600">
                    configurada
                  </span>
                ) : null}
              </span>
              <input
                type="password"
                autoComplete="off"
                className={fieldClass}
                value={config.payments?.secretKey ?? ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    payments: {
                      ...config.payments,
                      secretKey: e.target.value,
                    },
                  })
                }
              />
            </label>
            <label className="block">
              <span className={labelClass}>
                Public Key (pk_…)
                {config.paymentsConfigured?.publicKey ? (
                  <span className="ml-2 text-xs font-normal text-emerald-600">
                    configurada
                  </span>
                ) : null}
              </span>
              <input
                type="password"
                autoComplete="off"
                className={fieldClass}
                value={config.payments?.publicKey ?? ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    payments: {
                      ...config.payments,
                      publicKey: e.target.value,
                    },
                  })
                }
              />
            </label>
            <label className="block">
              <span className={labelClass}>
                Recipient ID da plataforma (rp_…)
              </span>
              <input
                className={fieldClass}
                placeholder="rp_XXXXXXXXXXXXXXXX"
                value={config.payments?.platformRecipientId ?? ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    payments: {
                      ...config.payments,
                      platformRecipientId: e.target.value,
                    },
                  })
                }
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Taxa Squadio (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  className={fieldClass}
                  value={config.payments?.platformFeePercent ?? 0}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      payments: {
                        ...config.payments,
                        platformFeePercent: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
              <label className="block">
                <span className={labelClass}>Taxa Pagar.me estimada (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  className={fieldClass}
                  value={config.payments?.pagarmeFeePercent ?? 0}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      payments: {
                        ...config.payments,
                        pagarmeFeePercent: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            </div>
            {(() => {
              const platform = Number(config.payments?.platformFeePercent) || 0;
              const pagarme = Number(config.payments?.pagarmeFeePercent) || 0;
              const platformReais =
                Math.round(((100 * platform) / 100) * 100) / 100;
              const pagarmeReais =
                Math.round(((100 * pagarme) / 100) * 100) / 100;
              const recipientReais =
                Math.round((100 - platformReais - pagarmeReais) * 100) / 100;
              return (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  Em R$ 100,00: dono recebe{" "}
                  <strong>
                    R${" "}
                    {recipientReais.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                  ; Squadio + taxas{" "}
                  <strong>
                    R${" "}
                    {(platformReais + pagarmeReais).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                  .
                </p>
              );
            })()}
            <p className="text-xs text-slate-500">
              Deixe ******** nas chaves para manter o valor atual.
            </p>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Outras chaves de API
            </h2>
            <p className="text-sm text-slate-500">
              Deixe ******** para manter o valor atual.
            </p>
            <div className="grid gap-4">
              {(
                [
                  ["mapsApiKey", "Maps / Geocoding", "mapsApiKey"],
                  ["emailApiKey", "E-mail", "emailApiKey"],
                  ["firebaseServerKey", "Firebase", "firebaseServerKey"],
                ] as const
              ).map(([field, label, configuredKey]) => (
                <label key={field} className="block">
                  <span className={labelClass}>
                    {label}
                    {config.apiKeysConfigured[configuredKey] ? (
                      <span className="ml-2 text-xs font-normal text-emerald-600">
                        configurada
                      </span>
                    ) : null}
                  </span>
                  <input
                    type="password"
                    className={fieldClass}
                    value={config.apiKeys[field]}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        apiKeys: {
                          ...config.apiKeys,
                          [field]: e.target.value,
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Recarregar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar configurações"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
