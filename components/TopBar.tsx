import Link from "next/link";
import { site } from "@/lib/site";
import { AlertMark } from "./AlertLogo";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <Link href="/" className="logo" aria-label={`${site.name} ${site.portalName}, home`}>
          <AlertMark height={28} />
          <small>{site.portalName}</small>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/#demos">Demos</Link>
          <Link href="/#how-we-work">How We Work</Link>
          <a href={`mailto:${site.salesEmail}`}>Contact</a>
        </nav>
        <a className="btn btn-primary btn-sm" href={site.demoMailto}>
          Book a Demo
        </a>
      </div>
    </header>
  );
}
