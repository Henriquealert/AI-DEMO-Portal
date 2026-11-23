import Link from "next/link";
import type { AnyDemoConfig } from "@/lib/schema";
import { isFullDemo } from "@/lib/schema";
import { ArrowRight } from "./Icons";

export function stackChip(name: string) {
  return name.toUpperCase();
}

export function DemoCard({ demo, live }: { demo: AnyDemoConfig; live: boolean }) {
  const chips = (
    <ul className="tag-row" aria-label="Technology used">
      {demo.stack.map((s) => (
        <li key={s.name} className="tag">
          {stackChip(s.name)}
        </li>
      ))}
    </ul>
  );

  if (!isFullDemo(demo)) {
    return (
      <div className="card" aria-disabled="true">
        <div className="card-top">
          <span className="tag tag-plain">Coming soon</span>
        </div>
        <h3 className="card-title">{demo.title} (coming soon)</h3>
        <p className="card-desc">{demo.description}</p>
        <div className="card-foot">{chips}</div>
      </div>
    );
  }

  const showLive = live && demo.live.enabled;
  return (
    <Link href={`/demos/${demo.slug}`} className="card">
      <div className="card-top">
        <span className="tag-row">
          {showLive && <span className="tag tag-status">Live</span>}
          <span className={demo.status === "SAMPLE" ? "tag tag-plain" : "tag tag-status"}>{demo.status}</span>
        </span>
      </div>
      <h3 className="card-title">{demo.title}</h3>
      <p className="card-desc">{demo.description}</p>
      <p className="card-meta">
        {demo.company.name} · {demo.company.industry} · fictional
      </p>
      <div className="card-foot">
        {chips}
        <ArrowRight className="card-arrow" />
      </div>
    </Link>
  );
}
