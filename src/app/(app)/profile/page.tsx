"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { TopBar } from "@/components/shell/TopBar";
import { ProfileView } from "@/components/profile/ProfileView";
import { Button } from "@/components/ui/Button";

export default function MyProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-2 pb-4">
      <TopBar title="Profile" />
      <ProfileView person={user} />
      <div className="px-5">
        <Button
          variant="outline"
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
