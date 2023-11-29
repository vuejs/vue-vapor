<script setup lang="ts">
import { ref, computed } from 'vue/vapor'

const count = ref(1)
const double = computed(() => count.value * 2)
const html = computed(() => `<button>HTML! ${count.value}</button>`)

const inc = () => count.value++
const dec = () => count.value--

// @ts-expect-error
globalThis.count = count
// @ts-expect-error
globalThis.double = double
// @ts-expect-error
globalThis.inc = inc
// @ts-expect-error
globalThis.dec = dec
// @ts-expect-error
globalThis.html = html
</script>

<template>
  <button @click="inc">inc</button>
  <div v-once :id="count"><div :id="double" v-once/></div>
</template>

<style>
.red {
  color: red;
}

html {
  color-scheme: dark;
  background-color: #000;
  padding: 10px;
}
</style>
