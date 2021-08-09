<script setup>
import { ref } from 'vue'

const counter = ref(0)

function increment () {
  counter.value++
  console.log('incremented!')
}
</script>

<template>
  <button @click="increment()">Click Me</button>
  <p>You've pressed the button {{counter}} times.</p>
</template>

<style scoped>
button {
  background: #224e64;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
}
</style>
