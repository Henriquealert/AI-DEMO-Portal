import { site } from "@/lib/site";

export function CtaBand() {
  return (
    <section className="cta-band" aria-labelledby="cta-title">
      <div style={{ display: "grid", gap: 10 }}>
        <h2 id="cta-title" className="h2">
          Where does your team lose hours every week?
        </h2>
        <p className="muted prose">
          Tell us about the task. We will show you what a tool for it would look like.
        </p>
      </div>
      <a className="btn btn-primary" href={site.demoMailto}>
        Book a Demo
      </a>
    </section>
  );
}
