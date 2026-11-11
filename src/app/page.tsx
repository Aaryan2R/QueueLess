import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <nav className="nav">
        <Link className="logo" href="/">
          QueueLess
        </Link>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <Link href="/login">Log in</Link>
          <Link className="button" href="/signup">
            Create your queue
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div>
          <div className="eyebrow">Simple digital waiting</div>
          <h1>
            Less waiting.
            <br />
            More doing.
          </h1>
          <p className="lead">
            QueueLess gives small businesses a clear, branded virtual queue. Customers scan a QR code, take a ticket,
            and know exactly what is happening.
          </p>
          <div className="actions">
            <Link className="button" href="/signup">
              Create your queue
            </Link>
            <Link className="button secondary" href="#how-it-works">
              See how it works
            </Link>
          </div>
        </div>
        <div className="preview">
          <div className="muted">Customer ticket</div>
          <div className="preview-card">
            <div className="muted">Bluebird Café · Lunch queue</div>
            <div className="token">A27</div>
            <strong>Waiting</strong>
            <p className="muted">3 groups ahead · About 12 min</p>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="page">
        <div className="grid">
          <div className="card">
            <div className="eyebrow">01</div>
            <h2>Set up once</h2>
            <p className="muted">Create your business, choose a queue, and share the QR code at your entrance.</p>
          </div>
          <div className="card">
            <div className="eyebrow">02</div>
            <h2>Customers join</h2>
            <p className="muted">They scan, enter only the details you need, and receive a private ticket link.</p>
          </div>
          <div className="card">
            <div className="eyebrow">03</div>
            <h2>Serve clearly</h2>
            <p className="muted">Your team calls the next customer while everyone sees honest, current progress.</p>
          </div>
        </div>
      </section>
      <footer className="footer">QueueLess · A calm way to manage busy places.</footer>
    </main>
  );
}
