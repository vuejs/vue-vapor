// @ts-check
import {
  children,
  createSlot,
  defineComponent,
  getCurrentInstance,
  insert,
  on,
  ref,
  render as renderComponent,
  renderEffect,
  setText,
  template,
} from '@vue/vapor'

const t0 = template('<div class="parnet-container"></div>')

// <template #mySlot="{ message, changeMessage }">
//   <div clas="slotted">
//     <h1>{{ message }}</h1>
//     <button @click="changeMessage">btn parent</button>
//   </div>
// </template>
const t1 = template(
  '<div class="slotted"><h1><!></h1><button>parent btn</button></div>',
)

const Parent = defineComponent({
  vapor: true,
  props: undefined,
  setup(props) {},
  render(_ctx) {
    const n0 = /** @type {any} */ (t0())
    const s0 = createSlot({
      mySlot: scope => {
        const n1 = t1()
        const n2 = /** @type {any} */ (children(n1, 0))
        const n3 = /** @type {any} */ (children(n1, 1))
        renderEffect(() => {
          setText(n2, scope.message)
        })
        on(n3, 'click', scope.changeMessage)
        return [n1]
      },
      // e.g. default slot
      // default: () => {
      //   const n1 = t1()
      //   return [n1]
      // }
    })
    renderComponent(Child, {}, s0, n0)
    return n0
  },
})

const t2 = template(
  '<div class="child-container"><button>child btn</button></div>',
)

const Child = defineComponent({
  vapor: true,
  props: undefined,
  setup(props, { expose: __expose }) {
    __expose()
    const message = ref('Hello World!')
    function changeMessage() {
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
    const instance = /** @type {any} */ (getCurrentInstance())
    const { slots } = instance

    // <div>
    //   <slot name="mySlot" :message="msg" :changeMessage="changeMessage" />
    //   <button @click="changeMessage">button in child</button>
    // </div>
    const n0 = /** @type {any} */ (t2())
    const n1 = /** @type {any} */ (children(n0, 0))
    on(n1, 'click', _ctx.changeMessage)
    const s0 = slots.mySlot({
      get message() {
        return _ctx.message
      },
      get changeMessage() {
        return _ctx.changeMessage
      },
    })
    insert(s0, n0, n1)
    return n0
  },
})

export default Parent
