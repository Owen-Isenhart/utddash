"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { SectionCard } from "@/components/ui/section-card";
import { profileApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

      <SectionCard title="Account">
        <p className="text-sm text-slate-600">{user?.email}</p>
      </SectionCard>

      <SectionCard title="Edit profile">
        <form
          className="grid gap-3 md:grid-cols-2"
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
          <input
            name="full_name"
            defaultValue={user?.full_name || ""}
            placeholder="Full name"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <select
            name="role"
            defaultValue={user?.role || "both"}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="buyer">Buyer</option>
            <option value="provider">Provider</option>
            <option value="both">Both</option>
          </select>
          <input
            name="venmo_handle"
            defaultValue={user?.venmo_handle || ""}
            placeholder="Venmo handle"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            name="cashapp_handle"
            defaultValue={user?.cashapp_handle || ""}
            placeholder="CashApp handle"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            name="zelle_handle"
            defaultValue={user?.zelle_handle || ""}
            placeholder="Zelle handle"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            name="bio"
            defaultValue={user?.bio || ""}
            placeholder="Bio"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white md:col-span-2">
            Save changes
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
