<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
const handleClick = () => count.value++
</script>

<template>
  <button @click="handleClick" :id="count">
    {{count}}
  </button>
</template>
