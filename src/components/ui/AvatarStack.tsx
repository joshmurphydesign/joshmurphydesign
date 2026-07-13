import { useUserMap } from "@/lib/people";
import { Avatar } from "./Avatar";

export function AvatarStack({
  userIds,
  max = 4,
  size = 28,
}: {
  userIds: string[];
  max?: number;
  size?: number;
}) {
  const map = useUserMap();
  const shown = userIds.slice(0, max);
  const overflow = userIds.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((id, i) => {
        const u = map[id];
        if (!u) return null;
        return (
          <div key={id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}>
            <Avatar initials={u.avatarInitials} gradient={u.avatarColor} size={size} ring />
          </div>
        );
      })}
      {overflow > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-ink-700 text-[11px] font-semibold text-chalk-300 ring-2 ring-ink-950"
          style={{ width: size, height: size, marginLeft: -size * 0.32 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
