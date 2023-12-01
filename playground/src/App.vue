<script setup lang="ts">
import { ref, computed } from 'vue/vapor'

const count = ref(1)
const double = computed(() => count.value * 2)
const html = computed(() => `<button>HTML! ${count.value}</button>`)

const inc = () => count.value++
const dec = () => count.value--
</script>

<template>
  <h1 @keyup ="dec">{{count}}</h1>
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
