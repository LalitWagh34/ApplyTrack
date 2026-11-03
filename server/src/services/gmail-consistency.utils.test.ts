import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isGmailHistoryExpired,
  isUniqueConstraintViolation,
  shouldAdvanceHistoryCursor
} from './gmail-consistency.utils.js';

test('only advances a cursor from the exact value read by the job', () => {
  assert.equal(shouldAdvanceHistoryCursor({
    storedHistoryId: '150',
    startHistoryId: '150',
    nextHistoryId: '175'
  }), true);

  assert.equal(shouldAdvanceHistoryCursor({
    storedHistoryId: '175',
    startHistoryId: '150',
    nextHistoryId: '160'
  }), false);

  assert.equal(shouldAdvanceHistoryCursor({
    storedHistoryId: null,
    startHistoryId: '150',
    nextHistoryId: '175'
  }), true);
});

test('classifies expired-history and duplicate-create failures without loose typing', () => {
  assert.equal(isGmailHistoryExpired({ code: 404 }), true);
  assert.equal(isGmailHistoryExpired({ code: 500 }), false);
  assert.equal(isUniqueConstraintViolation({ code: 'P2002' }), true);
  assert.equal(isUniqueConstraintViolation({ code: 'P2025' }), false);
});
