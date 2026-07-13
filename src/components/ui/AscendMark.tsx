import Image from "next/image";

export function AscendMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/ascend-icon.png"
      alt="Ascend"
      width={size}
      height={size}
      priority
      style={{ objectFit: "contain" }}
    />
  );
}
