<script lang="ts">
import { defineComponent } from 'vue'
import { children, ref, setText, template, watchEffect } from 'vue/vapor'

export default defineComponent({
  setup(){
    const count = ref(1)

    setInterval(() => {
      count.value++
    }, 1000)

    return ()=> {
      const t0 = template('<p></p>')
      const n0 = t0()
      const {
        0: [n1],
      } = children(n0)
      watchEffect(() => {
        setText(n1, void 0, count.value)
      })
      return n0
    }
  }
})
</script>
