import { hasChanged } from '@vue/shared'

export function withMemo(
  memo: any[],
  update: () => void,
  cache: any[],
  index: number
) {
  const cached = cache
  if (cached && cached[index] && isMemoSame(cached[index], memo)) {
    return cached
  }
  update()
  cache[index] = memo.slice()
  return cache
}

export function isMemoSame(cached: any[], memo: any[]) {
  const prev: any[] = cached
  if (prev.length != memo.length) {
    return false
  }

  for (let i = 0; i < prev.length; i++) {
    if (hasChanged(prev[i], memo[i])) {
      return false
    }
  }

  return true
}
