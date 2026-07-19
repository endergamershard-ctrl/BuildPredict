"use client";

import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { getSlotIds, slotLabel } from "@/lib/build-state";
import type { BuildSelection, CatalogPart, CompatIssue } from "@/lib/types";

interface BuilderTableProps {
  selection: BuildSelection;
  resolved: Partial<Record<CategoryId, CatalogPart[]>>;
  issues: CompatIssue[];
  onChoose: (slot: CategoryId) => void;
  onClear: (slot: CategoryId, id?: string) => void;
  onToggleExtras: () => void;
}

export function BuilderTable({
  selection,
  resolved,
  issues,
  onChoose,
  onClear,
  onToggleExtras,
}: BuilderTableProps) {
  const rows = CATEGORIES.filter(
    (c) => c.core || selection.showExtras || (selection.parts[c.id]?.length ?? 0) > 0,
  );

  return (
    <div className="glow-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          System Builder
        </div>
        <button type="button" className="btn-ghost text-xs" onClick={onToggleExtras}>
          {selection.showExtras ? "Hide extras" : "Show peripherals & extras"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="matrix-table min-w-[760px]">
          <thead>
            <tr>
              <th className="w-36">Component</th>
              <th>Selection</th>
              <th>Key Specs</th>
              <th className="w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((cat) => {
              const ids = getSlotIds(selection, cat.id);
              const parts = resolved[cat.id] ?? [];
              const selected = parts.length > 0;
              const slotIssues = issues.filter((i) =>
                i.categories.includes(cat.id),
              );

              return (
                <tr key={cat.id}>
                  <td className="font-mono text-sm text-accent">
                    {slotLabel(cat.id)}
                    {cat.multiple ? (
                      <span className="ml-1 text-[0.65rem] text-muted">+</span>
                    ) : null}
                  </td>
                  <td>
                    {selected ? (
                      <div className="space-y-1">
                        {parts.map((part) => (
                          <div key={part.id} className="font-medium text-foreground">
                            {part.name}
                            {part.custom ? (
                              <span className="badge ml-2">custom</span>
                            ) : null}
                          </div>
                        ))}
                        {slotIssues.slice(0, 2).map((issue) => (
                          <div
                            key={issue.code + issue.message}
                            className={
                              issue.severity === "error"
                                ? "text-xs text-danger"
                                : issue.severity === "warning"
                                  ? "text-xs text-warning"
                                  : "text-xs text-muted"
                            }
                          >
                            {issue.message}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-matrix"
                        onClick={() => onChoose(cat.id)}
                      >
                        Choose a {slotLabel(cat.id)}
                      </button>
                    )}
                  </td>
                  <td className="text-sm text-muted">
                    {selected
                      ? parts.map((p) => p.summary || "—").join(" | ")
                      : "—"}
                  </td>
                  <td>
                    {selected ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-matrix"
                          onClick={() => onChoose(cat.id)}
                        >
                          {cat.multiple ? "Add" : "Swap"}
                        </button>
                        {cat.multiple
                          ? parts.map((part) => (
                              <button
                                key={part.id}
                                type="button"
                                className="btn-ghost"
                                onClick={() => onClear(cat.id, part.id)}
                              >
                                Remove
                              </button>
                            ))
                          : (
                              <button
                                type="button"
                                className="btn-ghost"
                                onClick={() => onClear(cat.id)}
                              >
                                Remove
                              </button>
                            )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">
                        {ids.length ? "Resolving…" : "Empty slot"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
