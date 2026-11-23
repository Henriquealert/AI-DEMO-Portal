import { getDemosByCategory } from "@/lib/demos";
import { categoryId } from "@/lib/schema";
import { howWeWork } from "@/lib/site";
import { isLiveConfigured } from "@/lib/live/config";
import { Catalogue } from "@/components/Catalogue";
import { CtaBand } from "@/components/CtaBand";
import { ArrowRight } from "@/components/Icons";

export default function HomePage() {
  const groups = getDemosByCategory();
  const live = isLiveConfigured();

  return (
    <div className="wrap">
      <section className="hero" aria-labelledby="page-title">
        <p className="label label-muted">Alert Global Tech · AI demos</p>
        <h1 id="page-title" className="h1">
          AI tools that give your team hours back.
        </h1>
        <p className="lede">Working demos with fictional companies and sample data. No signup needed.</p>
      </section>

      <nav aria-label="Categories" className="anchor-row">
        {groups.map((g) => (
          <a key={g.category} href={`#${categoryId(g.category)}`} className="label">
            {g.category}
            <span className="num">{String(g.demos.length).padStart(2, "0")}</span>
          </a>
        ))}
      </nav>

      <Catalogue groups={groups} live={live} />

      <section id="how-we-work" className="catalogue-section" aria-labelledby="how-title">
        <div className="section-head" style={{ borderBottom: 0 }}>
          <h2 id="how-title" className="label label-muted">
            How we work
          </h2>
        </div>
        <ol className="strip">
          {howWeWork.map((s, i) => (
            <li key={s.num}>
              <div className="steps-head">
                <span className="strip-num">{s.num}</span>
                {i < howWeWork.length - 1 && <ArrowRight className="strip-arrow" />}
              </div>
              <h3 className="strip-title">{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <CtaBand />
    </div>
  );
}
