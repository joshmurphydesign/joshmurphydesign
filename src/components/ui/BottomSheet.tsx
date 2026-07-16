"use client";

export function BottomSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="safe-bottom w-full max-w-md rounded-t-[28px] border-t border-chalk-300/10 bg-ink-900 p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
        {children}
      </div>
    </div>
  );
}
