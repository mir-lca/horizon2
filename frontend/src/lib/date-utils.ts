export const formatQuarterYear = (quarter: number, year: number): string => {
  return `Q${quarter}/${year}`;
};

export const formatDuration = (quarters: number): string => {
  const years = Math.floor(quarters / 4);
  const remainingQuarters = quarters % 4;

  if (years > 0 && remainingQuarters > 0) {
    return `${years}y ${remainingQuarters}q`;
  }
  if (years > 0) {
    return `${years}y`;
  }
  return `${remainingQuarters}q`;
};

export const calculateEndYear = (startYear: number, startQuarter: number, durationQuarters: number): number => {
  const yearsToAdd = Math.floor(durationQuarters / 4);
  const remainingQuarters = startQuarter + (durationQuarters % 4) - 1;

  return startYear + yearsToAdd + (remainingQuarters >= 4 ? 1 : 0);
};

export const calculateEndQuarter = (startQuarter: number, durationQuarters: number): number => {
  const remainingQuarters = (startQuarter + (durationQuarters % 4) - 1) % 4;
  return remainingQuarters === 0 ? 4 : remainingQuarters;
};

export interface QuarterInfo {
  year: number;
  quarter: number;
  label: string;
  absoluteIndex: number;
  formatted: string;
}

export const getQuarterFromAbsolute = (
  startYear: number,
  startQuarter: number,
  absoluteIndex: number
): QuarterInfo => {
  const absoluteStart = startYear * 4 + (startQuarter - 1);
  const targetAbsolute = absoluteStart + absoluteIndex;
  const year = Math.floor(targetAbsolute / 4);
  const quarter = (targetAbsolute % 4) + 1;

  return {
    year,
    quarter,
    label: `Q${quarter} ${year}`,
    absoluteIndex,
    formatted: formatQuarterYear(quarter, year),
  };
};

export const generateQuarterRange = (
  startYear: number,
  startQuarter: number,
  durationQuarters: number
): QuarterInfo[] => {
  const quarters: QuarterInfo[] = [];
  for (let i = 0; i < durationQuarters; i += 1) {
    quarters.push(getQuarterFromAbsolute(startYear, startQuarter, i));
  }
  return quarters;
};

export const generateQuarterRangeByDates = (
  startYear: number,
  startQuarter: number,
  endYear: number,
  endQuarter: number
): QuarterInfo[] => {
  const startVal = startYear * 4 + startQuarter - 1;
  const endVal = endYear * 4 + endQuarter - 1;
  const duration = endVal - startVal + 1;

  if (duration <= 0) return [];

  return generateQuarterRange(startYear, startQuarter, duration);
};

export const getQuarterOptions = () => [
  { value: "1", label: "Q1" },
  { value: "2", label: "Q2" },
  { value: "3", label: "Q3" },
  { value: "4", label: "Q4" },
];

export const getYearOptions = (rangeBack: number = 4, rangeForward: number = 5) => {
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let i = currentYear - rangeBack; i <= currentYear + rangeForward; i += 1) {
    years.push({ value: String(i), label: String(i) });
  }

  return years;
};
