import { WebApp } from 'meteor/webapp'
import launchMiddleware from 'launch-editor-middleware'

WebApp.connectHandlers.use('/__open-in-editor', launchMiddleware())
