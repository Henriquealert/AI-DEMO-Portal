import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap notfound">
      <p className="label label-muted">404</p>
      <h1 className="h1 h1-sm">This page does not exist.</h1>
      <p className="muted">The demo may have moved, or the link may be wrong.</p>
      <p>
        <Link href="/" className="btn">
          See All Demos
        </Link>
      </p>
    </div>
  );
}
