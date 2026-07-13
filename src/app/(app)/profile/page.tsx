"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { TopBar } from "@/components/shell/TopBar";
import { ProfileView } from "@/components/profile/ProfileView";
import { Button } from "@/components/ui/Button";
import { IconEdit } from "@/components/ui/Icons";

export default function MyProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-2 pb-4">
      <TopBar
        title="Profile"
        right={
          <button
            onClick={() => router.push("/profile/edit")}
            aria-label="Edit profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-chalk-100"
          >
            <IconEdit className="h-4 w-4" />
          </button>
        }
      />
      <div className="px-5">
        <div className="card-surface flex items-center justify-around rounded-2xl p-4">
          <div className="text-center">
            <p className="font-display text-xl text-gold-500">{"\u{1FA99}"} {user.points ?? 0}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-chalk-500">Points</p>
          </div>
          <div className="h-8 w-px bg-white/8" />
          <div className="text-center">
            <p className="font-display text-xl text-sky-500">{"\u{2744}\u{FE0F}"} {user.freezes ?? 0}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-chalk-500">Streak freezes</p>
          </div>
        </div>
      </div>
      <ProfileView person={user} />
      <div className="flex flex-col gap-2.5 px-5">
        <Button variant="outline" size="md" className="w-full" onClick={() => router.push("/profile/edit")}>
          Edit profile
        </Button>
        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
