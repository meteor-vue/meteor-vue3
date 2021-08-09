<script>
import { ref } from 'vue'

export default {
  setup () {
    const counter = ref(0)

    function increment () {
      counter.value++
      console.log('incremented!')
    }

    return {
      counter,
      increment
    }
  }
}
</script>

<template>
  <button @click="increment()">Click Me</button>
  <p>You've pressed the button {{counter}} times.</p>
  <button @click="meow.waf()">Throw template error</button>
</template>

<style scoped>
button {
  background: rgb(28, 124, 76);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
}
</style>
