export const nanoid = (size = 21): string => `test_${'x'.repeat(Math.max(1, size - 5))}`;
