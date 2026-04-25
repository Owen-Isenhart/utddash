import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-[linear-gradient(125deg,#f8f8e4_0%,#d8efe8_35%,#d0d9f6_100%)] px-4 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-white/60 bg-white/75 p-8 shadow-[0_20px_70px_rgba(16,24,40,0.18)] backdrop-blur md:p-12">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">UTD Campus Marketplace</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-900 md:text-6xl">
          Turn extra meal swipes into cash and discounted meals into a daily habit.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-700 md:text-lg">
          UTDDash connects UTD students who have unused meal swipes with students who want food
          at a better price. Secure handoff is enforced with an in-person QR completion flow.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
