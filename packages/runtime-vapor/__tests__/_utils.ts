import type { Data } from '@vue/shared'
import {
  type ComponentInternalInstance,
  type ObjectComponent,
  type SetupFn,
  render as _render,
  defineComponent,
  test_createComponent,
} from '../src'

export function makeRender<Component = ObjectComponent | SetupFn>(
  initHost = () => {
    const host = document.createElement('div')
    host.setAttribute('id', 'host')
    document.body.appendChild(host)
    return host
  },
) {
  let host: HTMLElement
  beforeEach(() => {
    host = initHost()
  })
  afterEach(() => {
    host.remove()
  })

  const define = (comp: Component) => {
    const component = defineComponent(comp as any)
    let instance: ComponentInternalInstance
    const render = (
      props: Data = {},
      container: string | ParentNode = '#host',
    ) => {
      instance = test_createComponent(component, props)
      _render(instance, container)
      return res()
    }
    const res = () => ({
      component,
      host,
      instance,
      render,
    })

    return res()
  }

  return define
}
