import { extend } from '@vue/shared'
import { render } from 'vue/vapor'

const modules = import.meta.glob<any>('./*.(vue|js)')
const mod = (modules['.' + location.pathname] || modules['./App.vue'])()

mod.then(({ default: m }) => {
  render(
    {
      props: m.props,
      blockFn: props => {
        const returned = m.setup?.(props, { expose() {} })
        const ctx = extend(props, returned) // TODO: merge
        return m.render(ctx)
      }
    },
    {
      /* TODO: raw props */
    },
    '#app'
  )
})
