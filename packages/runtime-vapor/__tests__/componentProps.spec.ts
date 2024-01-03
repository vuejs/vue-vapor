import { defineComponent, watchEffect } from 'vue'

import { template } from '../src/template'
import { children, setText } from '../src/dom'
import { render as renderComponent } from '../src/render'

let host: HTMLElement

const initHost = () => {
  host = document.createElement('div')
  host.setAttribute('id', 'host')
  document.body.appendChild(host)
}
beforeEach(() => initHost())
afterEach(() => host.remove())

describe('runtime: compoentn props', () => {
  // pending: https://github.com/vuejs/core-vapor/issues/84
  // test('should render props value (string array spec)', () => {
  //   const ChildComp = defineComponent({
  //     props: ['foo'],
  //     setup() {
  //       const __returned__ = {}
  //       Object.defineProperty(__returned__, '__isScriptSetup', {
  //         enumerable: false,
  //         value: true,
  //       })
  //       return __returned__
  //     },
  //     render(_ctx: any) {
  //       const t0 = template('<div></div>')
  //       const n0 = t0()
  //       const {
  //         0: [n1],
  //       } = children(n0)
  //       watchEffect(() => {
  //         setText(n1, void 0, _ctx.foo)
  //       })
  //       return n0
  //     },
  //   })
  //   const Comp = defineComponent({
  //     setup() {
  //       const __returned__ = {}
  //       Object.defineProperty(__returned__, '__isScriptSetup', {
  //         enumerable: false,
  //         value: true,
  //       })
  //       return __returned__
  //     },
  //     render() {
  //       const t0 = template('<div></div>')
  //       const n0 = t0()
  //       const {
  //         0: [n1],
  //       } = children(n0)
  //       renderComponent(
  //         ChildComp as any,
  //         {
  //           get foo() {
  //             return 'foo'
  //           },
  //         },
  //         n1 as any,
  //       )
  //       return n0
  //     },
  //   })
  //   renderComponent(Comp as any, {}, '#host')
  //   expect(host.innerHTML).toBe('<div><div>foo</div></div>')
  // })
})
