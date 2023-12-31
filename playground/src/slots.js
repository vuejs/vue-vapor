import {
  children,
  insert,
  on,
  ref,
  render as renderComponent, // TODO:
  setText,
  template,
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
    const t0 = template('<div class="parent"><button>increment</button></div>')

    const n0 = t0()
    const {
      0: [n1],
    } = children(n0)
    const {
      0: [b0],
    } = children(n1)
    on(b0, 'click', _ctx.handleClick)

    // default as function
    renderComponent(
      child,
      {},
      () => {
        const t0 = template('<div class="slot"></div>')
        const n0 = t0()
        const {
          0: [n1],
        } = children(n0)
        watchEffect(() => {
          setText(n1, void 0, _ctx.count)
        })
        return n0
      },
      n1,
    )

    // named slots
    renderComponent(
      child,
      {},
      {
        default: () => {
          const t0 = template('<div class="slot"></div>')
          const n0 = t0()
          const {
            0: [n1],
          } = children(n0)
          watchEffect(() => {
            setText(n1, void 0, _ctx.count)
          })
          return n0
        },
      },
      n1,
    )

    // scoped
    renderComponent(
      child,
      {},
      {
        default: () => {
          const t0 = template('<div class="slot"></div>')
          const n0 = t0()
          const {
            0: [n1],
          } = children(n0)
          watchEffect(() => {
            setText(n1, void 0, _ctx.count)
          })
          return n0
        },
        a: props => {
          const t0 = template('<p></p>')
          const n0 = t0()
          const {
            0: [n1],
          } = children(n0)
          watchEffect(() => {
            setText(n1, void 0, props.message)
          })
          return n0
        },
      },
      n1,
    )

    return n1
  },
}

const child = {
  setup(_, { slots }) {
    console.log('slots: ', slots)

    const message = ref('hello')
    const changeMessage = () => {
      message.value += '!'
    }
    const __returned__ = { message, changeMessage }

    Object.defineProperty(__returned__, '__isScriptSetup', {
      enumerable: false,
      value: true,
    })

    return __returned__
  },

  render(_ctx) {
    const t0 = template('<div class="child"></div>')
    const t1 = template('<button>change message</button>')

    const n0 = t0()
    const {
      0: [n1],
    } = children(n0)
    const s0 = _ctx.$slots.default?.()
    if (s0) {
      insert(s0, n1)
    }

    const s1 = _ctx.$slots.a?.(
      // TODO: discuss interface
      {
        get message() {
          return _ctx.message
        },
      },
    )
    if (s1) {
      const n2 = t1()
      const {
        0: [n3],
      } = children(n2)
      on(n3, 'click', _ctx.changeMessage)
      insert(s1, n1)
      insert(n2, n1)
    }

    return n0
  },
}
