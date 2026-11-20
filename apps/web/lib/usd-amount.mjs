// Exact USD decimal to integer nanodollars, with no floating-point rounding.
export function usdToNanodollars(value) {
  if (typeof value !== 'string' || !/^\d{1,7}(?:\.\d{1,9})?$/.test(value)) throw new Error('Invalid USD amount');
  const [whole, fraction = ''] = value.split('.');
  const result = BigInt(whole) * 1000000000n + BigInt(fraction.padEnd(9, '0'));
  if (result > 1000000000000000n) throw new Error('USD amount exceeds supported range');
  return result.toString();
}

export function nanodollarsToUsd(value) {
  if (typeof value !== 'string' || !/^\d{1,19}$/.test(value)) throw new Error('Invalid nanodollar amount');
  const amount = BigInt(value);
  if (amount > 1000000000000000000n) throw new Error('Nanodollar amount exceeds supported range');
  const whole = amount / 1000000000n;
  const fraction = (amount % 1000000000n).toString().padStart(9, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}
