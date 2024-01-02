<script setup>
import { ref } from 'vue'
import Child from './component-child.vue'

const msg = ref('Hello world')

let i = 0
const increment = () => {
  msg.value = 'Hello world ' + ++i
}
</script>

<template>
  <div>
    B;
    <button @click="increment">inc</button>
    <Child test="a" :random="msg" />

    ;C
  </div>
</template>
