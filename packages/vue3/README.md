# vuejs:vue3

## Installation

```sh
meteor add vuejs:vue3
```

## Basic usage

Start a subscription (with static parameters):

```js
import { subscribe } from 'meteor/vuejs:vue3'

export default {
  setup () {
    subscribe('links.all' /*, 'some', 'params', 'here' */)
  }
}
```

Star a subscription (with reactive parameters):

```js
import { ref } from 'vue'
import { autoSubscribe } from 'meteor/vuejs:vue3'

export default {
  setup () {
    const filter = ref('meow')

    autoSubscribe(() => 'links.some', filter.value)
  }
}
```

Use Tracker:

```js
import { autorun } from 'meteor/vuejs:vue3'
// Import some collection
import { Links } from '/imports/api/links/links.js'

export default {
  setup () {
    const links = autorun(() => Links.find({}))

    return {
      links,
    }
  }
}
```

Full example:

```vue
<script setup>
import { Links } from '/imports/api/links/links.js'
import { subscribe } from 'meteor/vuejs:vue3'

subscribe('links.all')

const { result: links } = autorun(() => Links.find({}))

function submit (form) {
  const title = form.title
  const url = form.url

  Meteor.call('links.insert', title.value, url.value, (error) => {
    if (error) {
      alert(error.error)
    } else {
      title.value = ''
      url.value = ''
    }
  })
}
</script>

<template>
  <h2>Learn Meteor!</h2>
  <ul>
    <li>
      <form @submit.prevent="submit($event.target)">
        <input type="text" name="title" placeholder="Title" required>
        <input type="url" name="url" placeholder="Url" required>
        <input type="submit" name="submit" value="Add new link">
      </form>
    </li>
    <li v-for="link of links" :key="link._id">
      <a href="{{link.url}}" target="_blank">{{link.title}}</a>
    </li>
  </ul>
</template>
```
