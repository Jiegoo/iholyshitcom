import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usdToNanodollars, nanodollarsToUsd } from '../lib/usd-amount.mjs';

test('USD amounts convert exactly without floating-point rounding', () => {
  for (const [value, nanos] of [['0','0'], ['0.000000001','1'], ['1.01','1010000000'], ['1000000','1000000000000000']])
    { assert.equal(usdToNanodollars(value), nanos); assert.equal(nanodollarsToUsd(nanos), value); }
  assert.equal(nanodollarsToUsd('1000000000000000000'), '1000000000');
  assert.throws(() => nanodollarsToUsd('1000000000000000001'));
  for (const value of ['', '-1', '.1', '1.', '1e3', '1.0000000001', '1000000.000000001'])
    assert.throws(() => usdToNanodollars(value));
});
