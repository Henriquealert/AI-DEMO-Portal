"use client";

import { useMemo, useState } from "react";
import type { AnyDemoConfig, Category } from "@/lib/schema";
import { categoryId, isFullDemo } from "@/lib/schema";
import { DemoCard } from "./DemoCard";
import { SearchIcon } from "./Icons";

type Group = { category: Category; demos: AnyDemoConfig[] };

function haystack(d: AnyDemoConfig) {
  const parts = [d.title, d.description, d.category, ...d.stack.map((s) => s.name)];
  if (isFullDemo(d)) parts.push(d.company.name, d.company.industry);
  return parts.join(" ").toLowerCase();
}

export function Catalogue({
  groups,
  live,
  logos,
}: {
  groups: Group[];
  live: boolean;
  logos: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);

  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          demos: g.demos.filter((d) => {
            const h = haystack(d);
            return terms.every((t) => h.includes(t));
          }),
        }))
        .filter((g) => g.demos.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, query],
  );

  const total = groups.reduce((n, g) => n + g.demos.length, 0);
  const shown = filtered.reduce((n, g) => n + g.demos.length, 0);

  return (
    <div id="demos">
      <div className="search" role="search">
        <label htmlFor="tool-search">
          <SearchIcon />
          <span className="sr-only">Find a tool</span>
        </label>
        <input
          id="tool-search"
          type="search"
          placeholder="Find a tool…"
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-describedby="search-count"
        />
        <span id="search-count" className="search-count small" aria-live="polite">
          {shown === total ? `${total} tools` : `${shown} of ${total}`}
        </span>
      </div>
      <p className="hint">Filter by name, category, industry or technology.</p>

      {filtered.length === 0 && (
        <p className="empty">
          No tools match “{q}”. Try a category such as SALES, or a technology such as Claude.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="catalogue">
          {filtered.map((g) => {
            const id = categoryId(g.category);
            return (
              <section key={g.category} id={id} className="cat-row" aria-labelledby={`h-${id}`}>
                <div className="cat-label">
                  <h2 id={`h-${id}`} className="label">
                    {g.category}
                  </h2>
                  <span className="label label-muted num">
                    {String(g.demos.length).padStart(2, "0")} {g.demos.length === 1 ? "tool" : "tools"}
                  </span>
                </div>
                <ul className={g.demos.length === 1 ? "cat-cards single" : "cat-cards"}>
                  {g.demos.map((d) => (
                    <li key={d.slug}>
                      <DemoCard demo={d} live={live} logo={logos[d.slug]} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
