// Lambda entry point for Node.js 18.x+ compatibility
const { handler } = require('./dist/index.js');

module.exports = { handler };