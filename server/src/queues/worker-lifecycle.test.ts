import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { hasFollowUpWork, startPeriodicWorker } from './worker-lifecycle.js';

test('follow-up worker skips only an empty queue without either schedule type', async () => {
  const queue = {
    getJobCounts: async (...types: string[]) => {
      assert.deepEqual(types, ['wait', 'active', 'delayed', 'prioritized', 'waiting-children', 'paused', 'failed']);
      return {};
    },
    getRepeatableJobs: async () => [],
    getJobSchedulers: async () => []
  };
  assert.equal(await hasFollowUpWork(queue), false);
  for (const state of ['wait', 'active', 'delayed', 'prioritized', 'waiting-children', 'paused', 'failed']) {
    assert.equal(await hasFollowUpWork({ ...queue, getJobCounts: async () => ({ [state]: 1 }) }), true);
  }
  assert.equal(await hasFollowUpWork({
    ...queue,
    getRepeatableJobs: async () => [{ key: 'legacy', name: 'daily', endDate: null, tz: null, pattern: '0 3 * * *' }]
  }), true);
  assert.equal(await hasFollowUpWork({
    ...queue, getJobSchedulers: async () => [{ key: 'scheduler', name: 'daily' }]
  }), true);
  await assert.rejects(hasFollowUpWork({
    ...queue, getJobCounts: async () => { throw new Error('Redis unavailable'); }
  }), /Redis unavailable/);
});

class FakeWorker extends EventEmitter {
  closes = 0;
  finish: () => void = () => {};
  private finished = new Promise<void>(resolve => { this.finish = resolve; });
  async close(): Promise<void> {
    this.closes++;
    await this.finished;
  }
}

test('maintenance starts immediately, waits for active work, restarts, and cancels on shutdown', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const workers: FakeWorker[] = [];
  const service = startPeriodicWorker(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker;
  }, 300_000, error => assert.fail(String(error)));
  assert.equal(workers.length, 1);
  workers[0].emit('drained');
  workers[0].emit('drained');
  t.mock.timers.tick(600_000);
  assert.equal(workers.length, 1);
  assert.equal(workers[0].closes, 1);
  workers[0].finish();
  await Promise.resolve();
  await Promise.resolve();
  t.mock.timers.tick(299_999);
  assert.equal(workers.length, 1);
  t.mock.timers.tick(1);
  assert.equal(workers.length, 2);
  workers[1].emit('drained');
  const shutdown = service.close();
  workers[1].finish();
  await shutdown;
  t.mock.timers.tick(600_000);
  assert.equal(workers.length, 2);
  await service.close();
  assert.equal(workers[1].closes, 1);
});

test('shutdown closes an active maintenance worker and clears an idle wakeup', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const idle of [false, true]) {
    const worker = new FakeWorker();
    let starts = 0;
    const service = startPeriodicWorker(() => { starts++; return worker; }, 300_000, error => assert.fail(String(error)));
    if (idle) worker.emit('drained');
    worker.finish();
    await Promise.resolve();
    await Promise.resolve();
    await service.close();
    t.mock.timers.tick(600_000);
    assert.equal(starts, 1);
    assert.equal(worker.closes, 1);
  }
});
