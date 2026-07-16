/**
 * Native share sheet where available (mobile browsers), clipboard copy otherwise.
 * Returns which path was used so the caller can show the right confirmation.
 */
export async function shareText(title: string, text: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch {
      // User cancelled the share sheet, or the browser rejected it — fall through to clipboard.
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "failed";
    }
  }
  return "failed";
}
