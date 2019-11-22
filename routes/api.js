const express = require('express');
const router = express.Router();

const fs = require('fs');
const join = require('path').join;

const api = join(__dirname, 'api');

// Bootstrap api
fs.readdirSync(api)
    .filter(file => ~file.search(/^[^\.].*\.js$/))
    .forEach(file => module.require(join(api, file))(router));

module.exports = router;
