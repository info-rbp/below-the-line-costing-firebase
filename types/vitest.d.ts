export type TestFn = (name: string, fn: () => void | Promise<void>) => void;

declare module "vitest" {
  export const describe: TestFn;
  export const it: TestFn;
  export const test: TestFn;
  export function expect(actual: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeCloseTo(expected: number, precision?: number): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeDefined(): void;
    toBeUndefined(): void;
  };
}
