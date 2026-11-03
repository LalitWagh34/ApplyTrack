export interface HistoryCursorAdvanceInput {
  storedHistoryId: string | null;
  startHistoryId: string;
  nextHistoryId: string;
}

/**
 * A cursor can only advance from the exact value read by this job. This makes
 * overlapping Gmail notifications harmless: an older job cannot overwrite a
 * cursor already advanced by a newer job.
 */
export function shouldAdvanceHistoryCursor(input: HistoryCursorAdvanceInput): boolean {
  return input.nextHistoryId.length > 0
    && input.nextHistoryId !== input.startHistoryId
    && (input.storedHistoryId === input.startHistoryId || input.storedHistoryId === null);
}

export function isGmailHistoryExpired(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 404;
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'P2002';
}
