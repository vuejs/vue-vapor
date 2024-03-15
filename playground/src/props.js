// @ts-check
import {
  createComponent,
  defineComponent,
  on,
  ref,
  setText,
  template,
  watch,
  watchEffect,
} from '@vue/vapor'

const t0 = template('<button></button>')

export default defineComponent({
  vapor: true,
  setup() {
    const count = ref(1)
    const handleClick = () => {
      count.value++
    }

    return (() => {
      const n0 = /** @type {HTMLButtonElement} */ (t0())
      on(n0, 'click', () => handleClick)
      watchEffect(() => setText(n0, count.value))
      /** @type {any} */
      const n1 = createComponent(child, {
        /* <Comp :count="count" /> */
        count: () => count.value,

        /* <Comp :inline-double="count * 2" /> */
        inlineDouble: () => count.value * 2,
      })
      return [n0, n1]
    })()
  },
})

const t1 = template('<p></p>')
const child = defineComponent({
  vapor: true,

  props: {
    count: { type: Number, default: 1 },
    inlineDouble: { type: Number, default: 2 },
  },

  setup(props) {
    watch(
      () => props.count,
      v => console.log('count changed', v),
    )
    watch(
      () => props.inlineDouble,
      v => console.log('inlineDouble changed', v),
    )

    return (() => {
      const n0 = /** @type {HTMLParagraphElement} */ (t1())
      watchEffect(() => {
        setText(n0, props.count + ' * 2 = ' + props.inlineDouble)
      })
      return n0
    })()
  },
})
