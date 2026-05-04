export interface HistoryQueryLike {
  data?: any;
  previousData?: any;
  isFetching?: boolean;
}

const readTotal = (payload: any) =>
  payload?.data?.total ??
  payload?.data?.pagination?.total ??
  payload?.total ??
  payload?.pagination?.total;

const readTotalPages = (payload: any) =>
  payload?.data?.totalPages ??
  payload?.data?.pagination?.totalPages ??
  payload?.totalPages ??
  payload?.pagination?.totalPages;

export const getHistoryTotal = (
  query: HistoryQueryLike | null | undefined,
  fallbackLength: number,
) => readTotal(query?.data) ?? readTotal(query?.previousData) ?? fallbackLength;

export const getHistoryMaxPage = (
  query: HistoryQueryLike | null | undefined,
  pageSize: number,
  fallbackLength: number,
) => {
  const totalPages = readTotalPages(query?.data) ?? readTotalPages(query?.previousData);

  if (Number.isFinite(totalPages) && Number(totalPages) > 0) {
    return Math.max(1, Number(totalPages));
  }

  const total = Number(getHistoryTotal(query, fallbackLength) ?? 0);
  const safePageSize = Math.max(1, Number(pageSize) || 1);

  return Math.max(1, Math.ceil(total / safePageSize));
};

interface ClampHistoryPageOptions {
  query: HistoryQueryLike | null | undefined;
  page: number;
  pageSize: number;
  fallbackLength: number;
  setPage: (page: number) => void;
}

export const clampHistoryPage = ({
  query,
  page,
  pageSize,
  fallbackLength,
  setPage,
}: ClampHistoryPageOptions) => {
  if (query?.isFetching) return;

  const maxPage = getHistoryMaxPage(query, pageSize, fallbackLength);
  if (page > maxPage) setPage(maxPage);
};
