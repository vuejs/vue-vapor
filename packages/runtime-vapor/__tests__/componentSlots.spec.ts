// NOTE: This test is implemented based on the case of `runtime-core/__test__/componentSlots.spec.ts`.

import {
  createComponent,
  defineComponent,
  getCurrentInstance,
  nextTick,
  ref,
  template,
} from '../src'
import { createSlots } from '../src/slot'
import { makeRender } from './_utils'

const define = makeRender<any>()

describe('component: slots', () => {
  function renderWithSlots(slots: any): any {
    let instance: any
    const Comp = defineComponent({
      vapor: true,
      render() {
        const t0 = template('<div></div>')
        const n0 = t0()
        instance = getCurrentInstance()
        return n0
      },
    })

    const { render } = define({
      render() {
        return createComponent(Comp, {}, slots)
      },
    })

    render()
    return instance
  }

  test('initSlots: instance.slots should be set correctly', () => {
    const { slots } = renderWithSlots({ _: 1 })
    expect(slots).toMatchObject({ _: 1 })
  })

  test.todo(
    'initSlots: should normalize object slots (when value is null, string, array)',
    () => {
      // TODO: normalize
    },
  )

  test.todo(
    'initSlots: should normalize object slots (when value is function)',
    () => {
      // TODO: normalize
    },
  )

  test('initSlots: instance.slots should be set correctly', () => {
    let instance: any
    const { render } = define({
      render() {
        const t0 = template('<div></div>')
        const n0 = t0()
        instance = getCurrentInstance()
        return n0
      },
    })

    render(
      {},
      createSlots({
        header: () => {
          const t0 = template('header')
          // TODO: single node
          return [t0()]
        },
      }),
    )
    expect(instance.slots.header()).toMatchObject([
      document.createTextNode('header'),
    ])
  })

  test('initSlots: instance.slots should be set correctly (when vnode.shapeFlag is not SLOTS_CHILDREN)', () => {
    const { slots } = renderWithSlots(
      createSlots({
        // TODO: normalize from array
        default: () => {
          const t0 = template('<span></span>')
          return [t0()]
        },
      }),
    )

    // TODO: warn
    // expect(
    //   '[Vue warn]: Non-function value encountered for default slot. Prefer function slots for better performance.',
    // ).toHaveBeenWarned()

    expect(slots.default()).toMatchObject([document.createElement('span')])
  })

  // TODO: dynamic slot
  test.todo(
    'updateSlots: instance.slots should be updated correctly',
    async () => {
      const flag1 = ref(true)

      let instance: any
      const Child = () => {
        instance = getCurrentInstance()
        return template('child')()
      }

      const { render } = define({
        render() {
          return createComponent(
            Child,
            {},
            createSlots({
              default: () => {
                // TODO: dynamic slot
                return flag1.value
                  ? [template('<span></span>')()]
                  : [template('<div></div>')()]
              },
            }),
          )
        },
      })

      render()

      expect(instance.slots.default()).toMatchObject([])
      expect(instance.slots.default()).not.toMatchObject([])

      flag1.value = false
      await nextTick()

      expect(instance.slots.default()).not.toMatchObject([])
      expect(instance.slots.default()).toMatchObject([])
    },
  )

  // TODO: dynamic slots
  test.todo(
    'updateSlots: instance.slots should be updated correctly',
    async () => {
      const flag1 = ref(true)

      let instance: any
      const Child = () => {
        instance = getCurrentInstance()
        return template('child')()
      }

      const oldSlots = {
        header: () => template('header')(),
        footer: undefined,
      }
      const newSlots = {
        header: undefined,
        footer: () => template('footer')(),
      }

      const { render } = define({
        render() {
          const t0 = template('<div></div>')
          const n0 = t0()
          // renderComponent(
          //   Child,
          //   {},
          //   createSlots(flag1.value ? oldSlots : newSlots),
          //   n0 as ParentNode,
          // )
          return []
        },
      })

      render()

      expect(instance.slots).toMatchObject({ _: null })

      flag1.value = false
      await nextTick()

      expect(instance.slots).toMatchObject({ _: null })
    },
  )

  test.todo(
    'updateSlots: instance.slots should be update correctly (when vnode.shapeFlag is not SLOTS_CHILDREN)',
    async () => {
      // TODO: dynamic slots
    },
  )

  test.todo('should respect $stable flag', async () => {
    // TODO: $stable flag
  })

  test.todo('should not warn when mounting another app in setup', () => {
    // TODO: warning and createApp fn
    // const Comp = {
    //   render() {
    //     const i = getCurrentInstance()
    //     return i?.slots.default?.()
    //   },
    // }
    // const mountComp = () => {
    //   createApp({
    //     render() {
    //       const t0 = template('<div></div>')
    //       const n0 = t0()
    //       renderComponent(
    //         Comp,
    //         {},
    //         createSlots({
    //           default: () => {
    //             const t0 = template('msg')
    //             return [t0()]
    //           },
    //         }),
    //         n0,
    //       )
    //       return n0
    //     },
    //   })
    // }
    // const App = {
    //   setup() {
    //     mountComp()
    //   },
    //   render() {
    //     return null
    //   },
    // }
    // createApp(App).mount(document.createElement('div'))
    // expect(
    //   'Slot "default" invoked outside of the render function',
    // ).not.toHaveBeenWarned()
  })
})
