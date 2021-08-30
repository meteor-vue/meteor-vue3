import { Tracker } from 'meteor/tracker'
import { Meteor } from 'meteor/meteor'
import { computed, ComputedRef, onUnmounted, ref, watch, watchEffect } from 'vue'

export interface AutorunEffect<TResult> {
  result: ComputedRef<TResult>
  stop: () => void
}

export function autorun<TResult = unknown> (callback: () => TResult): AutorunEffect<TResult> {
  const result = ref<TResult>()
  const stop = watchEffect((onInvalidate) => {
    const computation = Tracker.autorun(() => {
      let value: any = callback()
      if (value != null && typeof value.fetch === 'function') {
        value = value.fetch()
      }
      result.value = value
    })
    onInvalidate(() => {
      computation.stop()
    })
  })
  return {
    result: computed<TResult>(() => result.value as TResult),
    stop,
  }
}

export function autoResult<TResult = unknown> (callback: () => TResult): ComputedRef<TResult> {
  return autorun(callback).result
}

export interface ReactiveMeteorSubscription {
  stop: () => void
  ready: ComputedRef<boolean>
}

export function subscribe (name: string, ...args: any[]): ReactiveMeteorSubscription {
  const sub = Meteor.subscribe(name, ...args)
  const ready = autorun(() => sub.ready())

  function stop (): void {
    ready.stop()
    sub.stop()
  }

  onUnmounted(() => {
    stop()
  })

  return {
    stop,
    ready: ready.result,
  }
}

export function autoSubscribe (callback: () => [name: string, ...args: any[]]): ReactiveMeteorSubscription {
  const ready = ref(false)
  const stop = watch(callback, (value, oldValue, onInvalidate) => {
    const sub = Meteor.subscribe(...value)

    const computation = Tracker.autorun(() => {
      ready.value = sub.ready()
    })

    onInvalidate(() => {
      sub.stop()
      computation.stop()
    })
  }, {
    immediate: true,
    deep: true,
  })

  return {
    stop,
    ready: computed(() => ready.value),
  }
}
