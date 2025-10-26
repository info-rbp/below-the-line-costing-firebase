const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  if (isFiniteNumber(value)) {
    return value;
  }
  return 0;
};

export function safeAdd(...values: Array<number | string | null | undefined>): number {
  return values.reduce((sum, value) => sum + toNumber(value), 0);
}

export function safeMul(
  a: number | string | null | undefined,
  b: number | string | null | undefined
): number {
  return toNumber(a) * toNumber(b);
}

export function round2(value: number): number {
  const factor = 100;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function toCents(value: number | string | null | undefined): number {
  const amount = toNumber(value);
  return Math.round((amount + Number.EPSILON) * 100);
}

export function fromCents(cents: number): number {
  if (!isFiniteNumber(cents)) {
    return 0;
  }
  return round2(cents / 100);
}
