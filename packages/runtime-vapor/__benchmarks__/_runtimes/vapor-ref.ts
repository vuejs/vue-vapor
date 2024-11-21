import type { BenchOptions } from 'vitest'
import {
  type App,
  type ComponentInternalInstance,
  children,
  createFor,
  createSelector,
  createVaporApp,
  defineComponent,
  delegate,
  delegateEvents,
  insert,
  nextTick,
  ref,
  renderEffect,
  setClass,
  setText,
  template,
} from '../../src'
import { basicOptions } from '../_utils'

export function createListAppWithRef({
  initHost = (): HTMLDivElement => {
    const host = document.createElement('div')
    host.setAttribute('id', 'host')
    document.body.appendChild(host)
    return host
  },
} = {}) {
  let host: HTMLElement
  let t0: () => Node, t1: () => Node

  let instance: ComponentInternalInstance | undefined
  let app: App | undefined

  const ctx = {
    app: () => app,
    instance: () => instance,
    list: ref<{ id: number; label: string }[]>([]),
    selected: ref(),
    createItem: (
      (id = 0) =>
      (label = `no.${id}`) => ({ id: id++, label })
    )(),
    createItems: (length: number) =>
      Array.from({ length }, () => ctx.createItem()),

    select: (id: number) => {
      ctx.selected.value = id
    },
    remove: (id: number) => {
      ctx.list.value.splice(
        ctx.list.value.findIndex(item => item.id === id),
        1,
      )
    },
  }

  const component = defineComponent(() => {
    const isSelected = createSelector(ctx.selected)

    const n6 = t1()

    const n0 = createFor(
      () => ctx.list.value,
      ctx0 => {
        const n5 = t0()
        const n2 = n5.firstChild
        const n3 = children(n5, 1, 0)
        const n4 = children(n5, 2, 0)
        delegate(
          n3 as HTMLElement,
          'click',
          () => $event => ctx.select(ctx0[0].value.id),
        )
        delegate(
          n4 as HTMLElement,
          'click',
          () => $event => ctx.remove(ctx0[0].value.id),
        )
        renderEffect(() => setText(n2 as HTMLElement, ctx0[0].value.id))
        renderEffect(() => setText(n3, ctx0[0].value.label))
        renderEffect(() =>
          setClass(n5 as HTMLElement, {
            danger: isSelected(ctx0[0].value.id),
          }),
        )
        return n5
      },
      item => item.id,
      undefined,
      n6 as ParentNode,
    )
    insert(n0, n6 as ParentNode)
    return n6
  })

  const options = {
    ...basicOptions,
    setup: handleSetup,
    teardown: handleTeardown,
  } satisfies BenchOptions

  return {
    ctx,
    wait,
    html,
    options,
  }

  function handleSetup() {
    host = initHost()
    appSetup()
    appRender()
  }
  function handleTeardown() {
    host.remove()
  }
  function wait() {
    return nextTick()
  }
  function html() {
    return host.innerHTML
  }

  // --- ctx ---

  function appSetup() {
    t0 = template('<tr><td></td><td><a></a></td><td><a> remove </a></td></tr>')
    t1 = template('<div></div>')
    delegateEvents('click')
  }
  function appRender() {
    app && app.unmount()
    app = createVaporApp(component, {})
    instance = app.mount(host)
  }
}
