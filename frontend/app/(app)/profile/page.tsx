"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { profileApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ProfilePayload = {
  full_name: string;
  bio: string;
  role: "buyer" | "provider" | "both";
  venmo_handle: string;
  cashapp_handle: string;
  zelle_handle: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (payload: ProfilePayload) => profileApi.update(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
      </div>

      <SectionCard title="Account Details" description="Your authenticated identity">
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
          <p className="font-semibold text-foreground">{user?.email}</p>
        </div>
      </SectionCard>

      <SectionCard title="Edit Profile" description="Update your public information and payment handles">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            saveMutation.mutate({
              full_name: String(formData.get("full_name") || ""),
              bio: String(formData.get("bio") || ""),
              role: String(formData.get("role") || "both") as "buyer" | "provider" | "both",
              venmo_handle: String(formData.get("venmo_handle") || ""),
              cashapp_handle: String(formData.get("cashapp_handle") || ""),
              zelle_handle: String(formData.get("zelle_handle") || ""),
            });
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <Input name="full_name" defaultValue={user?.full_name || ""} placeholder="Full name" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              name="role"
              defaultValue={user?.role || "both"}
              className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="buyer">Buyer</option>
              <option value="provider">Provider</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Venmo Handle</label>
            <Input name="venmo_handle" defaultValue={user?.venmo_handle || ""} placeholder="@username" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">CashApp Handle</label>
            <Input name="cashapp_handle" defaultValue={user?.cashapp_handle || ""} placeholder="$cashtag" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Zelle Info</label>
            <Input name="zelle_handle" defaultValue={user?.zelle_handle || ""} placeholder="Phone or email" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Bio</label>
            <Input name="bio" defaultValue={user?.bio || ""} placeholder="A short bio about yourself" />
          </div>

          <Button type="submit" className="md:col-span-2 mt-2" isLoading={saveMutation.isPending}>
            Save changes
          </Button>
        </form>
      </SectionCard>
    </div>
  );
}
