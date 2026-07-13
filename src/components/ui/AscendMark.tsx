export function AscendMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ascend-mark-grad" x1="4" y1="40" x2="44" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3d2ee0" />
          <stop offset="55%" stopColor="#8a4cff" />
          <stop offset="100%" stopColor="#ff5c3d" />
        </linearGradient>
      </defs>
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
