<script>
import Counter from './Counter.vue'
import ScriptSetup from './ScriptSetup.vue'
import Info from './Info.vue'

export default {
  components: {
    Counter,
    ScriptSetup,
    Info,
  },
}
</script>

<template>
  <Counter />
  <br>
  <ScriptSetup />
  <br>
  <Info />
</template>
