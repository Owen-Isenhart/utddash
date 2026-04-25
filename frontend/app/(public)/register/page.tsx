"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-xl shadow-xl border-border">
        <CardHeader>
          <CardTitle className="text-2xl">Create your UTDDash account</CardTitle>
          <CardDescription>Join the marketplace to buy or sell meal swipes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Full name</label>
                <Input {...register("full_name")} error={!!errors.full_name} />
                {errors.full_name && <p className="text-sm text-danger">{errors.full_name.message}</p>}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">UTD email</label>
                <Input type="email" {...register("email")} error={!!errors.email} />
                {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input type="password" {...register("password")} error={!!errors.password} />
                {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Role</label>
                <select
                  {...register("role")}
                  className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <option value="buyer">Buyer</option>
                  <option value="provider">Provider</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Venmo</label>
                <Input {...register("venmo_handle")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">CashApp</label>
                <Input {...register("cashapp_handle")} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Zelle</label>
                <Input {...register("zelle_handle")} />
              </div>
            </div>

            {errors.root && <p className="mt-3 text-sm text-danger">{errors.root.message}</p>}

            <Button type="submit" className="w-full mt-6" isLoading={isSubmitting}>
              Create account
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
