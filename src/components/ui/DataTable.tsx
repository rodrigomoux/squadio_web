"use client";

import { useMemo, useState, type ReactNode } from "react";

export type DataColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  /** Valor usado na busca e ordenação (string/number) */
  getValue?: (row: T) => string | number | null | undefined;
  render: (row: T) => ReactNode;
};

export type RowAction<T> = {
  label: string;
  onClick: (row: T) => void;
  tone?: "default" | "danger";
};

type DataTableProps<T> = {
  rows: T[];
  columns: DataColumn<T>[];
  getRowId: (row: T) => string;
  searchKeys?: Array<(row: T) => string | number | null | undefined>;
  searchPlaceholder?: string;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  toolbar?: ReactNode;
  actions?: RowAction<T>[];
};

function compareValues(a: string | number | null | undefined, b: string | number | null | undefined) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR", { sensitivity: "base" });
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  searchKeys,
  searchPlaceholder = "Buscar…",
  pageSize = 10,
  loading = false,
  emptyMessage = "Nenhum registro encontrado.",
  toolbar,
  actions = [],
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) {
      const getters =
        searchKeys ??
        columns.map(
          (c) =>
            c.getValue ??
            ((row: T) => {
              const rendered = c.render(row);
              return typeof rendered === "string" || typeof rendered === "number"
                ? rendered
                : "";
            }),
        );
      list = rows.filter((row) =>
        getters.some((get) => String(get(row) ?? "").toLowerCase().includes(q)),
      );
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        const get = col.getValue ?? (() => "");
        list = [...list].sort((a, b) => {
          const cmp = compareValues(get(a), get(b));
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }
    return list;
  }, [rows, query, sortKey, sortDir, columns, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
        <div className="relative min-w-[200px] flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
        {toolbar}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 transition hover:text-slate-800"
                    >
                      {col.header}
                      <span className="text-slate-300">
                        {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="w-12 px-4 py-3 text-right">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={columns.length + (actions.length ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (actions.length ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!loading &&
              pageRows.map((row, index) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    className={`border-b border-slate-50 transition hover:bg-blue-50/50 ${
                      index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 text-slate-700 ${col.className ?? ""}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="relative px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((cur) => (cur === id ? null : id))
                          }
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Ações"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMenuId === id && (
                          <>
                            <button
                              type="button"
                              className="fixed inset-0 z-10 cursor-default"
                              aria-label="Fechar menu"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-4 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                              {actions.map((action) => (
                                <button
                                  key={action.label}
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    action.onClick(row);
                                  }}
                                  className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                                    action.tone === "danger"
                                      ? "text-red-600"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
        <p>
          {filtered.length === 0
            ? "0 registros"
            : `${(currentPage - 1) * pageSize + 1}–${Math.min(
                currentPage * pageSize,
                filtered.length,
              )} de ${filtered.length}`}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-2 tabular-nums">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
