import { Tracker } from 'meteor/tracker'
import { Meteor } from 'meteor/meteor'
import { computed, ComputedRef, onUnmounted, ref, watch, watchEffect } from 'vue'

export interface AutorunEffect<TResult> {
  result: ComputedRef<TResult | undefined>
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
    result: computed<TResult | undefined>(() => result.value),
    stop,
  }
}

export function subscribe (name: string, ...args: any[]): Meteor.SubscriptionHandle {
  const sub = Meteor.subscribe(name, ...args)
  onUnmounted(() => {
    sub.stop()
  })
  return sub
}

export interface AutoSubscribe {
  stop: () => void
}

export function autoSubscribe (callback: () => [name: string, ...args: any[]]): AutoSubscribe {
  const stop = watch(callback, (value, oldValue, onInvalidate) => {
    const sub = Meteor.subscribe(...value)
    onInvalidate(() => {
      sub.stop()
    })
  }, {
    immediate: true,
    deep: true,
  })

  return {
    stop,
  }
}
