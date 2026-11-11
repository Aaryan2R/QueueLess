import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="card">
        <h1>Page not found</h1>
        <p className="muted">The queue or page you requested does not exist.</p>
        <Link className="button" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
