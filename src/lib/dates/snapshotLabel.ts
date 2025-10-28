export type MaybeTimestamp =
  | string
  | { toDate: () => Date }
  | { seconds: number; nanoseconds?: number }
  | undefined
  | null;

export function snapshotLabel(id: string, createdAt: MaybeTimestamp): string {
  let d: Date | null = null;
  const v = createdAt;

  if (!v) {
    d = null;
  } else if (typeof v === "string") {
    const parsed = new Date(v);
    d = Number.isNaN(parsed.getTime()) ? null : parsed;
  } else if (typeof (v as any).toDate === "function") {
    d = (v as any).toDate();
  } else if (typeof v === "object" && typeof (v as any).seconds === "number") {
    d = new Date((v as any).seconds * 1000);
  }

  if (!d) return `Snapshot ${id}`;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}
