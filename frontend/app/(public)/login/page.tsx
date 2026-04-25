"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid @utdallas.edu email").endsWith("@utdallas.edu"),
  password: z.string().min(6, "Password is required"),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Unable to sign in" });
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#effaf5,#f7f4ea)] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Use your UTD email and password.</p>

        <label className="mt-5 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          {...register("email")}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="netid@utdallas.edu"
        />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}

        <label className="mt-4 block text-sm font-medium text-slate-700">Password</label>
        <input
          type="password"
          {...register("password")}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="••••••••"
        />
        {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password.message}</p> : null}

        {errors.root ? <p className="mt-3 text-sm text-red-600">{errors.root.message}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
