const express = require('express');
const router = express.Router();

const controller = require('../controllers/access-point-controller');

router.get('/login/:client_id/:client_secret/:callback_url/:state', controller.actionLoginForm);

router.post('/login-ajax', controller.actionLoginAjax);

module.exports = router;
