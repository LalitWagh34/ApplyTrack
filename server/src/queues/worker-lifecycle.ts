import type { Queue } from 'bullmq';

export async function hasFollowUpWork(
  queue: Pick<Queue, 'getJobCounts' | 'getRepeatableJobs' | 'getJobSchedulers'>
): Promise<boolean> {
  const counts = await queue.getJobCounts(
    'wait', 'active', 'delayed', 'prioritized', 'waiting-children', 'paused', 'failed'
  );
  const repeats = await queue.getRepeatableJobs(0, 0);
  const schedulers = await queue.getJobSchedulers(0, 0);
  return Object.values(counts).some(count => count > 0) || repeats.length > 0 || schedulers.length > 0;
}

interface IdleWorker {
  on(event: 'drained', listener: () => void): unknown;
  close(): Promise<void>;
}

// Keep persisted BullMQ schedules, but release idle worker connections between scans.
// Each fresh worker also runs stalled-job recovery. Graceful close retains active locks
// until processing finishes; delayed retries are picked up by the next scan.
export function startPeriodicWorker(
  createWorker: () => IdleWorker,
  intervalMs: number,
  onError: (error: unknown) => void
): { close: () => Promise<void> } {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let worker: IdleWorker;
  let closing: Promise<void> | undefined;

  const start = (): void => {
    if (stopped) return;
    closing = undefined;
    worker = createWorker();
    worker.on('drained', () => {
      if (stopped || closing) return;
      closing = worker.close();
      void closing.then(() => {
        if (!stopped) timer = setTimeout(start, intervalMs);
      }).catch(onError);
    });
  };

  start();
  return {
    close: async () => {
      stopped = true;
      clearTimeout(timer);
      await (closing ??= worker.close());
    }
  };
}
