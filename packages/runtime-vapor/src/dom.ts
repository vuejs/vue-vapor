import { isArray, toDisplayString } from '@vue/shared'
import type { Block, ParentBlock } from './render'

export * from './dom/patchProp'
export * from './dom/templateRef'
export * from './dom/on'

export function insert(
  block: Block,
  parent: Node | Block[],
  anchor: Node | null = null,
) {
  if (isArray(parent)) {
    const index = anchor ? parent.indexOf(anchor) : -1
    if (index > -1) {
      parent.splice(index, 0, block)
    } else {
      parent.push(block)
    }
    return
  }

  if (block instanceof Node) {
    parent.insertBefore(block, anchor)
  } else if (isArray(block)) {
    for (const child of block) insert(child, parent, anchor)
  } else {
    insert(block.nodes, parent, anchor)
    block.anchor && parent.insertBefore(block.anchor, anchor)
  }
}

export function prepend(parent: ParentBlock, ...blocks: Block[]) {
  if (isArray(parent)) {
    parent.unshift(...blocks)
    return
  }

  const nodes: Node[] = []
  for (const block of blocks) {
    if (block instanceof Node) {
      nodes.push(block)
    } else if (isArray(block)) {
      prepend(parent, ...block)
    } else {
      prepend(parent, block.nodes)
      block.anchor && prepend(parent, block.anchor)
    }
  }
  if (!nodes.length) {
    return
  }
  // TODO use insertBefore for better performance https://jsbench.me/rolpg250hh/1
  parent.prepend(...nodes)
}

export function append(parent: ParentBlock, ...blocks: Block[]) {
  if (isArray(parent)) {
    parent.push(...blocks)
    return
  }

  const nodes: Node[] = []
  for (const block of blocks) {
    if (block instanceof Node) {
      nodes.push(block)
    } else if (isArray(block)) {
      append(parent, ...block)
    } else {
      append(parent, block.nodes)
      block.anchor && append(parent, block.anchor)
    }
  }
  if (!nodes.length) {
    return
  }
  // TODO use insertBefore for better performance
  parent.append(...nodes)
}

export function remove(block: Block, parent: ParentBlock) {
  if (isArray(parent)) {
    const index = parent.indexOf(block)
    if (index > -1) {
      parent.splice(index, 1)
    }
    return
  }

  if (block instanceof DocumentFragment) {
    remove(Array.from(block.childNodes), parent)
  } else if (block instanceof Node) {
    parent.removeChild(block)
  } else if (isArray(block)) {
    for (const child of block) remove(child, parent)
  } else {
    remove(block.nodes, parent)
    block.anchor && parent.removeChild(block.anchor)
  }
}

type Children = Record<number, [ChildNode, Children]>
export function children(nodes: ChildNode | ChildNode[]): Children {
  const result: Children = {}
  if (!isArray(nodes)) {
    nodes = Array.from(nodes.childNodes)
  }
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    result[i] = [n, children(n)]
  }
  return result
}

export function createTextNode(val: unknown): Text {
  // eslint-disable-next-line no-restricted-globals
  return document.createTextNode(toDisplayString(val))
}

export function createComment(data: string): Comment {
  // eslint-disable-next-line no-restricted-globals
  return document.createComment(data)
}

export function querySelector(selectors: string): Element | null {
  // eslint-disable-next-line no-restricted-globals
  return document.querySelector(selectors)
}
