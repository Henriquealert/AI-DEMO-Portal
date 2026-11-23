import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllDemos, getDemo, loadContext, loadSamples } from "@/lib/demos";
import { categoryId, isFullDemo } from "@/lib/schema";
import { isLiveConfigured } from "@/lib/live/config";
import { TryIt } from "@/components/TryIt";
import { CtaBand } from "@/components/CtaBand";
import { ArrowRight } from "@/components/Icons";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDemos()
    .filter(isFullDemo)
    .map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const demo = getDemo(slug);
  if (!demo) return {};
  const description = `${demo.description} Demo with ${demo.company.name}, a fictional ${demo.company.industry.toLowerCase()} company.`;
  return {
    title: demo.title,
    description,
    alternates: { canonical: `/demos/${demo.slug}` },
    openGraph: { title: demo.title, description, url: `/demos/${demo.slug}` },
    twitter: { title: demo.title, description },
  };
}

function SpecValue({ value }: { value: string }) {
  if (value.trim().toUpperCase() === "TODO") {
    return <span className="todo">To be measured</span>;
  }
  return <>{value}</>;
}

export default async function DemoPage({ params }: Params) {
  const { slug } = await params;
  const demo = getDemo(slug);
  if (!demo) notFound();

  const samples = loadSamples(demo);
  const context = loadContext(demo);
  const liveAvailable = isLiveConfigured() && demo.live.enabled;
  const status = liveAvailable ? `${demo.status} · LIVE AVAILABLE` : demo.status;

  const spec: [string, React.ReactNode][] = [
    ["Company (fictional)", demo.company.name],
    ["Industry", demo.company.industry],
    ["Input", demo.spec.input],
    ["Output", demo.spec.output],
    ["Stack", demo.stack.map((s) => s.name).join(", ")],
    ["Where it runs", demo.spec.whereItRuns],
    ["Manual time", <SpecValue key="m" value={demo.spec.manualTime} />],
    ["With tool", <SpecValue key="w" value={demo.spec.withTool} />],
    ["Status", status],
  ];

  return (
    <div className="wrap">
      <nav aria-label="Breadcrumb">
        <ol className="crumbs">
          <li>
            <Link href="/#demos">Demos</Link>
          </li>
          <li>
            <Link href={`/#${categoryId(demo.category)}`}>{demo.category}</Link>
          </li>
          <li aria-current="page">{demo.title}</li>
        </ol>
      </nav>

      <header className="demo-head">
        <div className="tag-row">
          {liveAvailable && <span className="tag tag-status">Live</span>}
          <span className={demo.status === "SAMPLE" ? "tag tag-plain" : "tag tag-status"}>{demo.status}</span>
          <span className="tag">Fictional company, sample data</span>
        </div>
        <h1 className="h1 h1-sm">{demo.title}</h1>
        <p className="lede">{demo.description}</p>
      </header>

      <section className="section" aria-labelledby="spec-title">
        <div className="section-head">
          <h2 id="spec-title" className="label label-muted">
            Spec
          </h2>
        </div>
        <div className="section-body">
          <table className="spec">
            <tbody>
              {spec.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="problem-title">
        <div className="section-head">
          <h2 id="problem-title" className="label label-muted">
            The problem
          </h2>
        </div>
        <div className="section-body prose">
          <p className="lede" style={{ color: "var(--fg)" }}>
            {demo.problem}
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="try-title" id="try">
        <div className="section-head">
          <h2 id="try-title" className="label label-muted">
            Try it
          </h2>
          <span className="hint">{demo.company.name} is fictional. All data is sample data.</span>
        </div>
        <div className="section-body">
          <TryIt
            slug={demo.slug}
            tryIt={demo.tryIt}
            samples={samples}
            context={context}
            stepLabels={demo.steps.map((s) => s.text.replace(/\.$/, ""))}
            liveAvailable={liveAvailable}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="section-head">
          <h2 id="how-title" className="label label-muted">
            How it works
          </h2>
        </div>
        <div className="section-body">
          <ol className="steps">
            {demo.steps.map((s, i) => (
              <li key={i}>
                <div className="steps-head">
                  <span className="label">
                    {String(i + 1).padStart(2, "0")} {s.label}
                  </span>
                  {i < demo.steps.length - 1 && <ArrowRight className="strip-arrow" />}
                </div>
                <p className="small muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="stack-title">
        <div className="section-head">
          <h2 id="stack-title" className="label label-muted">
            Stack
          </h2>
        </div>
        <div className="section-body">
          <ul className="stack-grid">
            {demo.stack.map((s) => (
              <li key={s.name}>
                <h3 className="strip-title">{s.name}</h3>
                <p className="small muted">{s.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
