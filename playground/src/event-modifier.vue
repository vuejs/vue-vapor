<script setup lang="ts">
import { ref } from 'vue/vapor'
const handleClick = () => {
  console.log('Hello, Vapor!')
}

const i = ref(0)
const j = ref(0)
const event = ref('click')
const changeEvent = () => {
  event.value = event.value === 'click' ? 'contextmenu' : 'click'
}
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

  <div>
    {{ j }}
    <button @[event]="j++">
      Add
    </button>
    <button @click="changeEvent">
      Change Event
    </button>
  </div>
</template>
