var messages = [ 'I am file D!' ];
/**
 //= require d.js
 @@end */

messages.push('I am file C!');
/**
 //= require c.js
 //= require d.js
 @@end */

messages.push('I am file B!');
/**
 //= require b.js
 //= require c.js
 @@end */

messages.push('I am file A!');
