import type { BenchOptions } from 'vitest'
import { basicOptions } from '../_utils'

export function createListAppOnVanilla({
  initHost = (): HTMLDivElement => {
    const host = document.createElement('div')
    host.setAttribute('id', 'host')
    document.body.appendChild(host)
    return host
  },
} = {}) {
  let host: HTMLElement

  let SEL, TMPL: DocumentFragment, SIZE
  let ID = 0
  let TBODY: HTMLElement, TROW: HTMLTemplateElement
  let ROWS: HTMLCollection

  const label = (value = `no.${ID}`) => value

  const labelOf = (r: Element) =>
    r.firstChild!.nextSibling!.firstChild!.firstChild

  const { cloneNode, insertBefore } = Node.prototype
  const clone = n => cloneNode.call(n, true)
  let _insert
  const insert: typeof insertBefore = (...args) => _insert(...args)
  // const insert: typeof insertBefore = ((...args) => {}) as any

  const ctx = {
    label,
    create,
    add,
    clear,
    clone,
    insert,
    rows: () => ROWS,
  }

  const options = {
    ...basicOptions,
    setup: handleSetup,
    teardown: handleTeardown,
  } satisfies BenchOptions

  return {
    ctx,
    html,
    options,
  }

  function handleSetup() {
    host = initHost()
    TROW = document.createElement('template')
    TROW.innerHTML = `<tr><td>?</td><td><a>?</a></td><td><a> remove </a></td></tr>`
    host.appendChild((TBODY = document.createElement('div')))
    ROWS = TBODY.children

    _insert = insertBefore.bind(TBODY)

    TBODY.onclick = e => {
      const t = e.target as HTMLElement,
        n = t.tagName,
        r = t.closest('tr')!
      e.stopPropagation()
      n == 'A' && t.firstElementChild
        ? r.remove()
        : (SEL && (SEL.className = ''), ((SEL = r).className = 'danger'))
    }
  }
  function handleTeardown() {
    host.remove()
  }

  function html() {
    return host.innerHTML
  }

  // --- ctx ---

  function create(count: number, add = false) {
    if (SIZE !== count) {
      TMPL = clone(TROW.content)

      if ((SIZE = count) > 50) {
        void [...Array(count / 50 - 1)].forEach(() =>
          TMPL.appendChild(clone(TMPL.firstChild)),
        )
      }

      if (!add) {
        clear()
        TBODY.remove()
      }
    }

    while (count) {
      for (const r of TMPL.children) {
        void (labelOf(r)!.nodeValue = label())
        void (r.firstChild!.firstChild!.nodeValue = String(ID++))
        void count--
      }

      insert(clone(TMPL), null)
    }

    if (!add) host.appendChild(TBODY)
  }

  function add(count: number) {
    create(count, true)
  }
  function clear() {
    TBODY.textContent = ''
    return (SEL = null)
  }
}
