import { RiskFactor } from "./types";

export const formatNumber = (
  num: number | string | undefined | null,
  options: Intl.NumberFormatOptions = {}
): string => {
  if (num === undefined || num === null) return "N/A";

  try {
    const value = typeof num === "string" ? parseFloat(num) : num;
    if (Number.isNaN(value)) return "N/A";
    return new Intl.NumberFormat("en-US", options).format(value);
  } catch (error) {
    console.error("Error formatting number:", error);
    return "Invalid Number";
  }
};

export function formatCurrency(
  amount: number | string | undefined | null,
  options: {
    currency?: string;
    locale?: string;
    abbreviate?: boolean;
    inMillions?: boolean;
  } = {}
): string {
  const { currency = "USD", locale = "en-US", abbreviate = false, inMillions = false } = options;

  if (amount === undefined || amount === null) return "N/A";

  try {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    if (Number.isNaN(value)) return "N/A";

    if (inMillions) {
      const inMillionsValue = value / 1000000;
      return (
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 1,
        }).format(inMillionsValue) + "M"
      );
    }

    if (abbreviate && Math.abs(value) >= 1000) {
      if (Math.abs(value) >= 1000000) {
        return (
          new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            maximumFractionDigits: 1,
          }).format(value / 1000000) + "M"
        );
      }
      return (
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 1,
        }).format(value / 1000) + "K"
      );
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(value);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return "N/A";
  }
}

export function formatCurrencyInMillions(amount: number | string | undefined | null): string {
  return formatCurrency(amount, { inMillions: true });
}

export const formatPercentage = (
  num: number | string | undefined | null,
  decimalPlaces: number = 1
): string => {
  if (num === undefined || num === null) return "N/A";

  try {
    const value = typeof num === "string" ? parseFloat(num) : num;
    if (Number.isNaN(value)) return "N/A";

    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value / 100);
  } catch (error) {
    console.error("Error formatting percentage:", error);
    return "Invalid Percentage";
  }
};

export const formatCompactNumber = (
  num: number | string | undefined | null,
  decimalPlaces: number = 1
): string => {
  if (num === undefined || num === null) return "N/A";

  try {
    const value = typeof num === "string" ? parseFloat(num) : num;
    if (Number.isNaN(value)) return "N/A";

    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
  } catch (error) {
    console.error("Error formatting compact number:", error);
    return "Invalid Number";
  }
};

export const roundToDecimalPlaces = (num: number | string, decimalPlaces: number = 2): number => {
  const value = typeof num === "string" ? parseFloat(num) : num;
  if (Number.isNaN(value)) return 0;

  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
};

export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

export function calculateDuration(startDate: string, endDate: string): string {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30);

    if (diffMonths < 12) {
      return `${diffMonths} months`;
    }
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    return months > 0 ? `${years} years, ${months} months` : `${years} years`;
  } catch (error) {
    console.error("Error calculating duration:", error);
    return "Invalid Duration";
  }
}

export function getRiskColorClass(risk: string | RiskFactor): string {
  const riskLower = typeof risk === "string" ? risk.toLowerCase() : risk;

  switch (riskLower) {
    case RiskFactor.Low:
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case RiskFactor.Medium:
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case RiskFactor.High:
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case RiskFactor.Critical:
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}
