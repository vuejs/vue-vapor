<script setup lang="ts">
import { ref, computed } from 'vue'
const count = ref(1)
const html = computed(() => `<button>HTML!</button>`)
const handleClick = () => {
  count.value++
}
// @ts-expect-error
globalThis.count = count
// @ts-expect-error
globalThis.html = html
// @ts-expect-error
globalThis.handleClick = handleClick
</script>

<template>
  <div v-memo="[html]" @click="handleClick">
    <div>The number is {{ count }}.</div>
    <div v-memo="[count]">
      {{ count }}
    </div>
  </div>
</template>
