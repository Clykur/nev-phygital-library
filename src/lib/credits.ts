export const CREDIT_TO_RUPEE_RATE = 1;
export const INITIAL_FREE_CREDITS = 5000;

const creditNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const rupeeNumber = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "INR",
});

export function creditsToRupees(credits: number): number {
  return credits * CREDIT_TO_RUPEE_RATE;
}

export function rupeesToCredits(rupees: number): number {
  return Math.round(rupees / CREDIT_TO_RUPEE_RATE);
}

export function fmtCredits(credits: number): string {
  return `${creditNumber.format(credits)} Credits`;
}

export function fmtRupees(rupees: number): string {
  return rupeeNumber.format(rupees);
}

export function fmtCreditWithRupeeEquivalent(credits: number): string {
  return `${fmtCredits(credits)} (${fmtRupees(creditsToRupees(credits))})`;
}
