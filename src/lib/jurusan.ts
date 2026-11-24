export function extractJurusanFromKelas(value?: string | null): string {
  if (!value) return '';
  const cleaned = value
    .trim()
    .replace(/^(X[Il]{1,2}|12|11|10)[\s-]+/i, '')
    .replace(/[\s-]+\d+$/, '')
    .trim();

  return cleaned || '';
}