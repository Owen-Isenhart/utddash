import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/20 via-background to-background"></div>
      
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-border bg-surface/60 p-8 shadow-2xl backdrop-blur-xl md:p-12">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-brand">UTD Campus Marketplace</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
          Turn extra meal swipes into cash and discounted meals into a daily habit.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
          UTDDash connects UTD students who have unused meal swipes with students who want food
          at a better price. Secure handoff is enforced with an in-person QR completion flow.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto">Create account</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">Sign in</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
