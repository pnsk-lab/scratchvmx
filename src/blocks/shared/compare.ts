export type Value = string | boolean | number | null | undefined

export const isWhiteSpace = (v: string): boolean => v.trim() === ''

export const isEquals = (a: Value, b: Value): boolean => {
  const strA = String(a)
  const strB = String(b)

  if ((strA === 'Infinity' && strB === 'Infinity') || (strA === '-Infinity' && strB === '-Infinity')) {
    return true
  }

  const numA = isWhiteSpace(strA) ? NaN : Number(a)
  const numB = isWhiteSpace(strB) ? NaN : Number(b)
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    // Compare as a number
    return numA === numB
  }

  // Compare as a string
  return strA.toLowerCase() === strB.toLowerCase()
}
