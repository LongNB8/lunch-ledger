import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { readLedger } from './ledger.functions';

export function useLedger(userId: string) {
  const fetchLedger = useServerFn(readLedger);
  return useSuspenseQuery(queryOptions({ queryKey: ['ledger', userId], queryFn: () => fetchLedger() }));
}