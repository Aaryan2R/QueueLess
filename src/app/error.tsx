"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page">
      <div className="card">
        <h1>Something went wrong</h1>
        <p className="muted">QueueLess could not load this page.</p>
        <button className="button" onClick={reset} type="button">
          Try again
        </button>
      </div>
    </main>
  );
}
