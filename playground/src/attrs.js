import {
  children,
  on,
  ref,
  render as renderComponent, // TODO:
  setText,
  template,
  watch,
  watchEffect,
} from '@vue/vapor'

export default {
  props: undefined,

  setup(_, {}) {
    const count = ref(1)
    const handleClick = () => {
      count.value++
    }

    const __returned__ = { count, handleClick }

    Object.defineProperty(__returned__, '__isScriptSetup', {
      enumerable: false,
      value: true,
    })

    return __returned__
  },

  render(_ctx) {
    const t0 = template('<button></button>')
    const n0 = t0()
    const {
      0: [n1],
    } = children(n0)
    on(n1, 'click', _ctx.handleClick)
    watchEffect(() => {
      setText(n1, void 0, _ctx.count)
    })

    renderComponent(
      child,
      {
        get count() {
          return _ctx.count
        },
      },
      n0,
    )

    return n0
  },
}

const child = {
  setup(_, { attrs }) {
    console.log('attrs: ', attrs)
    watch(
      () => attrs.count,
      v => console.log('attrs.count changed', v),
    )

    const __returned__ = {}

    Object.defineProperty(__returned__, '__isScriptSetup', {
      enumerable: false,
      value: true,
    })

    return __returned__
  },

  render(_ctx) {
    const t0 = template('<p></p>')
    const n0 = t0()
    const {
      0: [n1],
    } = children(n0)
    watchEffect(() => {
      setText(n1, void 0, _ctx.$attrs.count + ' * 2 = ' + _ctx.$attrs.count * 2)
    })
    return n0
  },
}
