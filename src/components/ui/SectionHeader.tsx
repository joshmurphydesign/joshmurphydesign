import Link from "next/link";

export function SectionHeader({
  title,
  subtitle,
  href,
  hrefLabel = "See all",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between px-5">
      <div>
        <h2 className="font-ui text-lg tracking-wide text-chalk-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-chalk-500">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-xs font-semibold text-chalk-500">
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}
