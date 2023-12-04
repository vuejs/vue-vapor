import { extend } from '@vue/shared'
import { watch } from 'vue'
import {
  children,
  on,
  ref,
  template,
  effect,
  setText,
  render as renderComponent // TODO:
} from '@vue/vapor'

export default {
  props: undefined,

  setup(_, {}) {
    const count = ref(1)
    const handleClick = () => {
      count.value++
    }
    return { count, handleClick }
  },

  render(_ctx) {
    const t0 = template('<button></button>')
    const n0 = t0()
    const {
      0: [n1]
    } = children(n0)
    on(n1, 'click', _ctx.handleClick)
    effect(() => {
      setText(n1, void 0, _ctx.count.value)
    })

    // TODO: create component fn?
    // const c0 = createComponent(...)
    // insert(n0, c0)
    renderComponent(
      {
        props: child.props,
        blockFn: props => {
          const returned = child.setup?.(props, { expose() {} })
          const ctx = extend(props, returned) // TODO: merge
          return child.render(ctx)
        }
      },
      // TODO: proxy??
      {
        /* <Comp :count="count" /> */
        get count() {
          return _ctx.count.value
        },

        /* <Comp :inline-double="count * 2" /> */
        get inlineDouble() {
          return _ctx.count.value * 2
        }
      },
      n0
    )

    return n0
  }
}

const child = {
  props: {
    count: { type: Number, default: 1 },
    inlineDouble: { type: Number, default: 2 }
  },

  setup(props) {
    watch(
      () => props.count,
      v => console.log('count changed', v)
    )
    watch(
      () => props.inlineDouble,
      v => console.log('inlineDouble changed', v)
    )
  },

  render(_ctx) {
    const t0 = template('<p></p>')
    const n0 = t0()
    const {
      0: [n1]
    } = children(n0)
    effect(() => {
      setText(n1, void 0, _ctx.count + ' * 2 = ' + _ctx.inlineDouble)
    })
    return n0
  }
}
