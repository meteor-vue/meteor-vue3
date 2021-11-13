# Meteor Vue3 compiler

_Forked from [Meteor-vue3](https://github.com/meteor-vue/meteor-vue3) to support compilers._

This Meteor Vue3 compiler is supported by [Altruistiq](https://altruistiq.com) and supports compiler plugins for templates and styling. Currently there are 2 compilere plugins available:

- [seamink:vue3-sass](https://github.com/Altruistiq/vue3-sass)
- [akryum:vue-pug](https://github.com/meteor-vue/vue-meteor/tree/master/packages/vue-pug)

but it is rather easy to build additional compilers.

## Install
```sh
meteor add seamink:meteor-vue3
```

## Usage
Adding compilers you can now do
```html
<template lang="pug">
  div
    h1 Hello World!
</template>
```

and

```scss
<style lang="scss" scoped>
.nice {
  .nested {
    sass {
      color: green;
    }
  }
}
</style>
```

and it will run and compile your Vue templates just fine.</br>
For more details see the documentation for the compilers.

## Creating compiler plugins
The compiler accepts any meteor build plugin that registers itself globally at

```js
global.vue = global.vue || {}
global.vue.lang = global.vue.lang || {}
```

Example
```js
global.vue.lang.pug = (input) => {
  // compile pug plugin function
  // must return html string
}

global.vue.lang.scss = (input) => {
  // compile sass plugin function
  // must return css string
}
```

It currently supports compilers for css and html. That means that the output of your compiler either needs to return css or html.