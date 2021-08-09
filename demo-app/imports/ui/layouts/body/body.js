import './body.html'
import { Meteor } from 'meteor/meteor'
import { createApp } from 'vue'
import App from '../../components/App.vue'

Meteor.startup(() => {
  const app = createApp(App)
  app.mount('#vue-app')
})
