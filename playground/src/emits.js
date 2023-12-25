import {
  children,
  on,
  ref,
  template,
  watchEffect,
  setText,
  render as renderComponent // TODO:
} from '@vue/vapor'

export default {
  props: undefined,

  setup(_, {}) {
    const count = ref(1)
    const setCount = v => {
      count.value = v
    }

    const __returned__ = { count, setCount }

    Object.defineProperty(__returned__, '__isScriptSetup', {
      enumerable: false,
      value: true
    })

    return __returned__
  },

  render(_ctx) {
    const t0 = template('<p></p>')
    const n0 = t0()
    const {
      0: [n1]
    } = children(n0)

    watchEffect(() => {
      setText(n1, void 0, _ctx.count)
    })

    renderComponent(
      child,
      {
        get count() {
          return _ctx.count
        },
        get ['onClick:child']() {
          return _ctx.setCount
        }
      },
      n0
    )

    renderComponent(
      child,
      {
        get count() {
          return _ctx.count
        },
        get ['onClick:childOnce']() {
          return _ctx.setCount
        }
      },
      n0
    )

    return n0
  }
}

const child = {
  props: {
    count: { type: Number, default: 1 }
  },

  setup(props, { emit }) {
    const handleClick = () => {
      emit('click:child', props.count * 2)
    }

    const __returned__ = { handleClick }

    Object.defineProperty(__returned__, '__isScriptSetup', {
      enumerable: false,
      value: true
    })

    return __returned__
  },

  render(_ctx) {
    const t0 = template('<button>set count * 2</button>')
    const n0 = t0()
    const {
      0: [n1]
    } = children(n0)
    on(n1, 'click', _ctx.handleClick)
    return n0
  }
}
