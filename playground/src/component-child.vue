<script setup>
import { computed, getCurrentInstance, watchEffect } from '@vue/runtime-vapor'

const child = 'Hello world'

defineProps({
  random: String,
})

const ctx = getCurrentInstance()
const random = computed(() => ctx.props.random)

// watchEffect(() => {
//   console.log('child', ctx.props.random)
// })
</script>
<template>
  <div>Child : {{ child }} -- {{ random }}</div>
</template>
