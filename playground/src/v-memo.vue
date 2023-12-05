<script setup lang="ts">
import { ref } from 'vue'
const count = ref(1)
const count2 = ref(2)
const handleClick = () => {
  count2.value++
}
// @ts-expect-error
globalThis.count = count
// @ts-expect-error
globalThis.count2 = count2
// @ts-expect-error
globalThis.handleClick = handleClick
</script>

<template>
  <div v-memo="[count2]" @click="handleClick">
    parent：count2: {{ count2 }} count: {{count}}
    <div v-memo="[count]">
      child：count2: {{ count2 }} count: {{count}}
    </div>
  </div>
  {{count2}}
</template>
