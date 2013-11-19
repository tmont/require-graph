var messages = [ 'I am file D!' ];
/** @depends
 * d.js
 */

messages.push('I am file C!');
/** @depends
 * c.js
 * d.js
 */

messages.push('I am file B!');
/** @depends
 * b.js
 * c.js
 */

messages.push('I am file A!');
