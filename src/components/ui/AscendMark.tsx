export function AscendMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ascend-mark-grad" x1="4" y1="40" x2="44" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0b3f7a" />
          <stop offset="55%" stopColor="#1379c9" />
          <stop offset="100%" stopColor="#35c2f2" />
        </linearGradient>
      </defs>
      <path
        d="M4 38 L14 26 L20 32 L30 18"
        stroke="url(#ascend-mark-grad)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M6 34 L18 18 L26 27 L42 6"
        stroke="url(#ascend-mark-grad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M42 6 L42 16 M42 6 L32 6" stroke="url(#ascend-mark-grad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
