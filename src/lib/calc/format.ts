import { fromCents } from "./money";

const formatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrencyFromCents = (value: number) => formatter.format(fromCents(value));

export const formatCurrency = (value: number) => formatter.format(value);
