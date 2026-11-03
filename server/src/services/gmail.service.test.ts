import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldInitializeGoogleHistoryCursor } from './gmail-watch.utils.js';

test('initializes a Gmail history cursor only when none is stored', () => {
  assert.equal(shouldInitializeGoogleHistoryCursor('123456789', null), true);
  assert.equal(shouldInitializeGoogleHistoryCursor('123456789', '987654321'), false);
  assert.equal(shouldInitializeGoogleHistoryCursor('', null), false);
});
