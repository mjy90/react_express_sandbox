export function transposeArray<T>(array: T[][]): T[][] {
  return array[0].map((_, i) => array.map(row => row[i]));
}
