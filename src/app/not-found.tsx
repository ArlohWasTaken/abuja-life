import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
      <h2 className="text-2xl font-bold mb-4">404 — Location Not Found in Abuja</h2>
      <p className="text-slate-400 mb-6">You seem to have taken a wrong turn past the city gate.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium"
      >
        Return to City Center
      </Link>
    </div>
  );
}
