/**
 * Pure Gmail watch helpers kept separate from API clients for deterministic tests.
 */
export function shouldInitializeGoogleHistoryCursor(
  historyId: string,
  existingHistoryId: string | null
): boolean {
  return historyId.length > 0 && existingHistoryId === null;
}
