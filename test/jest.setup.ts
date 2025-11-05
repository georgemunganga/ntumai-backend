let counter = 0;

jest.mock('uuid', () => ({
  v4: () =>
    `00000000-0000-4000-8000-${(++counter)
      .toString()
      .padStart(12, '0')}`,
}));
