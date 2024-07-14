/*! #__NO_SIDE_EFFECTS__ */
export function template(html: string) {
  let node: ChildNode
  const create = () => {
    // eslint-disable-next-line no-restricted-globals
    const t = document.createElement('template')
    t.innerHTML = html
    return t.content.firstChild!
  }
  return () => (node || (node = create())).cloneNode(true)
}

/*! #__NO_SIDE_EFFECTS__ */
export function children(node: Node, ...paths: number[]): Node {
  for (const idx of paths) {
    // In various situations, select the quickest approach.
    // See https://github.com/vuejs/core-vapor/pull/263
    switch (idx) {
      case 0:
        node = node.firstChild!
        break
      case 1:
        node = node.firstChild!.nextSibling!
        break
      default:
        node = node.childNodes[idx]
        break
    }
  }
  return node
}

/*! #__NO_SIDE_EFFECTS__ */
export function next(node: Node, offset: number): Node {
  for (let i = 0; i < offset; i++) {
    node = node.nextSibling!
  }
  return node
}
