/**
 * Export utilities for CSV and Excel
 */

export function exportToCsv(
  headers: string[],
  rows: Array<string[]>,
  filename: string
): void {
  const escapeCell = (cell: string) => {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportProjectsToCsv(projects: Array<{
  name: string;
  businessUnitId?: string;
  status?: string;
  riskLevel?: string;
  totalCost?: number;
  durationQuarters?: number;
  startYear?: number;
  startQuarter?: number;
}>): void {
  const headers = ['Name', 'Business unit', 'Status', 'Risk', 'Total cost (USD)', 'Duration (Q)', 'Start'];
  const rows = projects.map((p) => [
    p.name,
    p.businessUnitId ?? '',
    p.status ?? '',
    p.riskLevel ?? '',
    String(p.totalCost ?? 0),
    String(p.durationQuarters ?? 0),
    p.startYear && p.startQuarter ? `${p.startYear} Q${p.startQuarter}` : '',
  ]);
  exportToCsv(headers, rows, 'horizon-portfolio.csv');
}
