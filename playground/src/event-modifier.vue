<script setup lang="ts">
import { ref } from 'vue/vapor'
const handleClick = () => {
  console.log('Hello, Vapor!')
}

const i = ref(0)
</script>

<template>
  <form>
    <button @click="handleClick">submit</button>
  </form>

  <form>
    <button @click.prevent="handleClick">no submit</button>
  </form>


  <div>
    {{ i }}
    <button @click="i++">
      Add1
    </button>
  </div>
</template>
