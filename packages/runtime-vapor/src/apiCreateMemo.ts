import { type Block, type Fragment, fragmentKey } from './apiRender'
import { createComment, createTextNode, insert, remove } from './dom/element'
import { baseWatch } from '@vue/reactivity'
import { extend, hasChanged, isArray } from '@vue/shared'
import { nextTick } from './scheduler'

type BlockFn = (cache?: MemoCache[]) => Block

type MemoCache = {
  memo?: any[]
  watched: boolean
  fragment: Fragment
  shouldUpdate: boolean
}

export const createMemo = (
  memo: () => any[],
  render: BlockFn,
  index: number,
  cache: MemoCache[] = [],
): Fragment => {
  let tempMemo: any[]

  const isNested = index !== 0
  const anchor = __DEV__ ? createComment('memo') : createTextNode()
  const fragment: Fragment = {
    nodes: [],
    anchor,
    [fragmentKey]: true,
  }
  const cached: MemoCache = cache[index] || {
    fragment,
    /**
     * nested createMemo will be called by his parent,
     * so this flag prevents baseWatch from being called repeatedly.
     */
    watched: false,
    /* the memo should cached because the watch's newVal and oldVal are the same array */
    memo: undefined,
    shouldUpdate: false,
  }

  // if nested, the update timing is determined by the parent
  if (isNested) {
    !cached.watched &&
      baseWatch(
        memo,
        (newMemo: any[]) => {
          tempMemo = newMemo.slice()
          handleMemoChange(tempMemo, () => {
            cached.shouldUpdate = true
          })
        },
        { immediate: true, deep: true },
      )
    cached.watched = true
    cached.shouldUpdate && performUpdate(tempMemo!)
    return cached.fragment
  }
  // if not nested, the update timing is determined by the `memo` change
  else {
    baseWatch(
      memo,
      (newMemo: any[]) => {
        tempMemo = newMemo.slice()
        handleMemoChange(tempMemo, () => performUpdate(tempMemo))
      },
      { immediate: true, deep: true },
    )
    return cached.fragment
  }

  function handleMemoChange(newMemo: any[], cb: () => void) {
    const isMount = !isArray(cached.memo)
    if (isMount) {
      cb()
    } else if (!isMemoSame(cached.memo!, newMemo)) {
      nextTick(cb)
    }
  }

  function performUpdate(newMemo: any[]) {
    let { nodes: prevNodes, anchor } = cached.fragment
    let parent = anchor!.parentNode
    let nodes = (cached.fragment.nodes = render(cache))

    if (parent) {
      prevNodes && remove(prevNodes, parent)
      insert(nodes, parent, anchor)
    }
    cache[index] = extend(cached, {
      shouldUpdate: false,
      memo: newMemo,
    })
  }
}

function isMemoSame(preMemo: any[], memo: any[]) {
  if (preMemo.length != memo.length) {
    return false
  }

  for (let i = 0; i < preMemo.length; i++) {
    if (hasChanged(preMemo[i], memo[i])) {
      return false
    }
  }
  return true
}
