"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email").endsWith("@utdallas.edu"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "provider", "both"]),
  venmo_handle: z.string().optional(),
  cashapp_handle: z.string().optional(),
  zelle_handle: z.string().optional(),
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { role: "both" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Unable to register" });
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#effaf5,#f7f4ea)] px-4 py-8">
      <form onSubmit={onSubmit} className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Create your UTDDash account</h1>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input {...register("full_name")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.full_name ? <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p> : null}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">UTD email</label>
            <input type="email" {...register("email")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input type="password" {...register("password")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password.message}</p> : null}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <select {...register("role")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="buyer">Buyer</option>
              <option value="provider">Provider</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Venmo</label>
            <input {...register("venmo_handle")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">CashApp</label>
            <input {...register("cashapp_handle")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Zelle</label>
            <input {...register("zelle_handle")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>

        {errors.root ? <p className="mt-3 text-sm text-red-600">{errors.root.message}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}
