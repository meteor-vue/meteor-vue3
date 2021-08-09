// __VUE_HMR_RUNTIME__ is injected to global scope by @vue/runtime-core

export function genHotReloadCode (id) {
  return `
/* hot reload */
if (module.hot) {
  __script__.__hmrId = "${id}"
  const api = __VUE_HMR_RUNTIME__
  module.hot.accept()
  if (!api.createRecord('${id}', __script__)) {
    api.reload('${id}', __script__)
  }
}
`
}

// @TODO Meteor doesn't support specific HMR requests

// function genTemplateHotReloadCode (id, request) {
//   return `
//   module.hot.accept(${request}, () => {
//     api.rerender('${id}', render)
//   })
// `
// }
