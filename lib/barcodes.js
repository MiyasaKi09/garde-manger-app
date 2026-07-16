export function normalizeBarcode(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 14)
}

export function isValidGtin(value) {
  const code = normalizeBarcode(value)
  if (![8, 12, 13, 14].includes(code.length)) return false

  const digits = [...code].map(Number)
  const expected = digits.pop()
  let sum = 0
  for (let i = digits.length - 1, position = 1; i >= 0; i--, position++) {
    sum += digits[i] * (position % 2 === 1 ? 3 : 1)
  }
  return (10 - (sum % 10)) % 10 === expected
}
