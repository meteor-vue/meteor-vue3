// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by vue3.js.
import { name as packageName } from "meteor/vuejs:vue3";

// Write your tests here!
// Here is an example.
Tinytest.add('vue3 - example', function (test) {
  test.equal(packageName, "vue3");
});
