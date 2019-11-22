const controller = require('../../controllers/developer-controller');

module.exports = (router) => {
    router.post('/developer/registration',
        controller.actionRegistration
    );
    router.get('/developer/activation/:user/:activationCode',
        controller.actionActivation
    );
};
