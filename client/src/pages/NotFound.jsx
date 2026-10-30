import { Link } from 'react-router-dom';
import useSeoMetadata from '../services/useSeoMetadata';

export default function NotFound() {
  useSeoMetadata({
    title: 'Page not found · FileWiz',
    description: 'The requested FileWiz page could not be found.',
    robots: 'noindex, nofollow',
  });

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="text-3xl font-extrabold">This page isn’t available</h1>
      <p className="mt-3 text-slate-600">The link may be outdated, or the page may have moved.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link className="btn btn-primary" to="/">Go to FileWiz</Link>
        <Link className="btn btn-outline" to="/tools">Browse tools</Link>
      </div>
    </main>
  );
}
