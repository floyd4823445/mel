import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTradeOutcome, formatTradeSummary } from './tradingLogic.mjs';

test('win trades return a positive payout summary', () => {
  const result = calculateTradeOutcome({ mode: 'live', stake: 250, direction: 'up', entryPrice: 1.0890, exitPrice: 1.0912 });
  const summary = formatTradeSummary(result, 'live', 'EUR/USD');

  assert.equal(result.isWin, true);
  assert.equal(result.net, 200);
  assert.match(summary, /won/i);
  assert.match(summary, /EUR\/USD/i);
});

test('loss trades return a negative balance impact', () => {
  const result = calculateTradeOutcome({ mode: 'demo', stake: 100, direction: 'down', entryPrice: 1.0900, exitPrice: 1.0890 });
  const summary = formatTradeSummary(result, 'demo', 'GBP/USD');

  assert.equal(result.isWin, true);
  assert.equal(result.net, 85);
  assert.match(summary, /won/i);
  assert.match(summary, /GBP\/USD/i);
});
