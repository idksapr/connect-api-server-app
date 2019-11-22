const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('express-method-override');
const passport = require('passport');
const path = require('path');
const rootPath = require('app-root-path');
const cors = require('cors');

const api = require('./api');
const oauth2 = require('../middleware/oauth2');

const accessPoint = require('./access-point');

require('../middleware/auth');

module.exports = (app) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(methodOverride('method_override_param_name'));
    app.use(express.static(path.join(rootPath.toString(), 'views')));
    app.use(cors());

    app.use(passport.initialize());
    app.post('/oauth/token', oauth2.token);

    app.use('/api', api);
    app.use('/access-point', accessPoint);
};
