"use client";

import { useParams } from "next/navigation";
import { useUserMap } from "@/lib/people";
import { TopBar } from "@/components/shell/TopBar";
import { ProfileView } from "@/components/profile/ProfileView";

export default function PersonProfilePage() {
  const params = useParams<{ id: string }>();
  const userMap = useUserMap();
  const person = userMap[params.id];

  if (!person) {
    return (
      <div className="flex flex-col gap-4">
        <TopBar title="Profile" onBack />
        <p className="px-5 text-sm text-chalk-500">Couldn&apos;t find that athlete.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4">
      <TopBar title={person.name} onBack />
      <ProfileView person={person} />
    </div>
  );
}
