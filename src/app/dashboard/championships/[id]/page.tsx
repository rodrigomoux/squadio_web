"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { sportLabel } from "@/config/sports";
import type { Championship, Match, Team } from "@/lib/domain/types";
import {
  ChampionshipsService,
  TeamsService,
} from "@/services/domain/DomainService";

export default function ChampionshipDetailPage() {
  const params = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>(
    {},
  );

  const teamName = useMemo(() => {
    const map = new Map(teams.map((t) => [t._id, t.name]));
    return (id?: string | null) => (id ? map.get(id) || id.slice(-4) : "BYE");
  }, [teams]);

  async function load() {
    setError(null);
    try {
      const data = await ChampionshipsService.detail(params.id);
      setChampionship(data.championship);
      setMatches(data.matches);
      setTeams(data.teams);
      const mine = await TeamsService.listMine();
      setMyTeams(mine.filter((t) => t.modality === data.championship.modality));
      if (mine[0]) setTeamId(mine[0]._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function createTeam(e: FormEvent) {
    e.preventDefault();
    if (!championship) return;
    const name = prompt("Nome do time");
    if (!name) return;
    try {
      const team = await TeamsService.create({
        name,
        modality: championship.modality,
      });
      await ChampionshipsService.joinTeam(params.id, team._id);
      setMessage("Time criado e inscrito");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  async function joinExisting() {
    if (!teamId) return;
    try {
      await ChampionshipsService.joinTeam(params.id, teamId);
      setMessage("Time inscrito");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  async function generate() {
    if (!confirm("Gerar chaves? Partidas anteriores serão substituídas.")) return;
    try {
      await ChampionshipsService.generateBracket(params.id);
      setMessage("Chaves geradas");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  async function saveScore(matchId: string) {
    const s = scores[matchId];
    if (!s) return;
    try {
      await ChampionshipsService.reportScore(matchId, {
        homeScore: Number(s.home),
        awayScore: Number(s.away),
        autoConfirm: true,
      });
      setMessage("Resultado registrado");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  if (!championship) {
    return <p className="text-sm text-zinc-500">{error || "Carregando..."}</p>;
  }

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{championship.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {sportLabel(championship.modality)} · {championship.format} ·{" "}
          {championship.status} · {championship.teamIds?.length || 0} times
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Times inscritos
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {teams.map((t) => (
            <li
              key={t._id}
              className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
            >
              {t.name}
            </li>
          ))}
          {teams.length === 0 && (
            <li className="text-sm text-zinc-500">Nenhum time ainda.</li>
          )}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={createTeam}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            Criar time e inscrever
          </button>
          {myTeams.length > 0 && (
            <>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                {myTeams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={joinExisting}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                Inscrever time existente
              </button>
            </>
          )}
          <button
            type="button"
            onClick={generate}
            className="rounded-lg bg-[#1a2332] px-3 py-2 text-sm font-medium text-white"
          >
            Gerar chaves
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Chaves / partidas
        </h2>
        {matches.length === 0 && (
          <p className="text-sm text-zinc-500">
            Gere as chaves após inscrever os times.
          </p>
        )}
        {rounds.map((round) => (
          <div key={round} className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-medium text-zinc-700">
              {matches.find((m) => m.round === round)?.roundLabel || `Rodada ${round}`}
            </h3>
            <ul className="space-y-3">
              {matches
                .filter((m) => m.round === round)
                .map((m) => (
                  <li
                    key={m._id}
                    className="grid gap-2 rounded-lg bg-zinc-50 px-3 py-3 text-sm sm:grid-cols-[1fr_auto_1fr_auto]"
                  >
                    <span className="font-medium">{teamName(m.homeTeamId)}</span>
                    <span className="text-zinc-400">x</span>
                    <span className="font-medium">{teamName(m.awayTeamId)}</span>
                    <span className="text-xs text-zinc-500">{m.status}</span>
                    {m.status !== "confirmed" && m.homeTeamId && m.awayTeamId && (
                      <div className="col-span-full flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          placeholder="Casa"
                          className="w-20 rounded border border-zinc-300 px-2 py-1"
                          value={scores[m._id]?.home ?? ""}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [m._id]: {
                                home: e.target.value,
                                away: prev[m._id]?.away ?? "",
                              },
                            }))
                          }
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="Fora"
                          className="w-20 rounded border border-zinc-300 px-2 py-1"
                          value={scores[m._id]?.away ?? ""}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [m._id]: {
                                home: prev[m._id]?.home ?? "",
                                away: e.target.value,
                              },
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => saveScore(m._id)}
                          className="rounded bg-[#1a2332] px-3 py-1 text-white"
                        >
                          Salvar
                        </button>
                      </div>
                    )}
                    {m.status === "confirmed" && (
                      <p className="col-span-full text-zinc-600">
                        {m.homeScore} – {m.awayScore}
                      </p>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
