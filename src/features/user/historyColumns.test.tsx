import { describe, expect, it } from 'vitest';
import { createHistoryColumns, HISTORY_TABS } from './historyColumns';

describe('historyColumns', () => {
  it('keeps the seven history tabs available', () => {
    expect(HISTORY_TABS).toHaveLength(7);
  });

  it('creates payment columns for tab 1', () => {
    const columns = createHistoryColumns({ activeKey: '1' });

    expect(columns.map((column) => column.key)).toEqual([
      'paymentID',
      'date',
      'status',
      'price',
      'detail',
    ]);
  });

  it('creates store history columns for tab 7', () => {
    const columns = createHistoryColumns({ activeKey: '7' });

    expect(columns.map((column) => column.key)).toEqual(['date', 'name', 'price']);
  });

  it('separates fast track from total in use coin history columns', () => {
    const columns = createHistoryColumns({ activeKey: '2' });

    expect(columns.map((column) => column.key)).toEqual([
      'date',
      'bookTitle',
      'epTitle',
      'fastTrack',
      'total',
    ]);
  });
});
