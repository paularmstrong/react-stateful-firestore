// @flow
export const FetchStatus = {
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  NONE: 'none'
};

type Item = { fetchStatus: $Values<typeof FetchStatus> };

export const resolveInitialFetchStatus = (...items: Array<Item>): $Values<typeof FetchStatus> => {
  const statuses = items.map((item) => item.fetchStatus);
  if (statuses.some((status) => status === FetchStatus.LOADED)) {
    return FetchStatus.LOADED;
  }
  if (statuses.some((status) => status === FetchStatus.LOADING)) {
    return FetchStatus.LOADING;
  }
  if (statuses.some((status) => status === FetchStatus.FAILED)) {
    return FetchStatus.FAILED;
  }
  return FetchStatus.NONE;
};

export const resolveFetchStatus = (...items: Array<Item>): $Values<typeof FetchStatus> => {
  const statuses = items.map((item) => item.fetchStatus);
  if (statuses.some((status) => status === FetchStatus.FAILED)) {
    return FetchStatus.FAILED;
  }
  if (statuses.some((status) => status === FetchStatus.LOADING)) {
    return FetchStatus.LOADING;
  }
  if (statuses.every((status) => status === FetchStatus.LOADED)) {
    return FetchStatus.LOADED;
  }
  return FetchStatus.NONE;
};
