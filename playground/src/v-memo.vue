<script setup lang="ts">
import { ref } from 'vue'
const count = ref(1)
const count2 = ref(2)
const count3 = ref(3)
const count4 = ref(4)
const handleClick = () => {
  count2.value++
}
// @ts-expect-error
globalThis.count = count
// @ts-expect-error
globalThis.count2 = count2
// @ts-expect-error
globalThis.count3 = count3
// @ts-expect-error
globalThis.count4 = count4
// @ts-expect-error
globalThis.handleClick = handleClick
</script>

<template>
  <div v-memo="[count2, count3]" @click="handleClick">
    parent：count2: {{ count2 }} count: {{count}}
    <div v-memo="[count,count4]">
      child：count2: {{ count2 }} count: {{count}}
    </div>
  </div>
  {{count2}}
</template>
