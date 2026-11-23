import Link from "next/link";
import { site } from "@/lib/site";
import { getDemosByCategory } from "@/lib/demos";
import { isFullDemo } from "@/lib/schema";
import { ArrowUpRight } from "./Icons";

export function Footer() {
  const groups = getDemosByCategory();
  return (
    <footer className="footer">
      <div className="wrap">
        <p className="footer-statement">{site.footerStatement}</p>
        <div className="footer-grid">
          <div>
            <h2 className="label label-muted">Contact</h2>
            <ul>
              <li>
                <a href={`mailto:${site.salesEmail}`}>{site.salesEmail}</a>
              </li>
              <li>
                <a href={site.mainSite}>
                  alertglobal.tech <ArrowUpRight size={11} className="inline-icon" />
                </a>
              </li>
            </ul>
          </div>
          {groups.map((g) => (
            <div key={g.category}>
              <h2 className="label label-muted">{g.category}</h2>
              <ul>
                {g.demos.map((d) =>
                  isFullDemo(d) ? (
                    <li key={d.slug}>
                      <Link href={`/demos/${d.slug}`}>{d.title}</Link>
                    </li>
                  ) : (
                    <li key={d.slug} className="muted small">
                      {d.title} (coming soon)
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-base">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <span>All companies, people and data in these demos are fictional.</span>
        </div>
      </div>
    </footer>
  );
}
