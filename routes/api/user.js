const passport = require('passport');
const controller = require('../../controllers/user-controller');

module.exports = (router) => {
    router.post('/user/registration/:clientAppId/:clientAppSecret/:role',
        controller.actionRegistration
    );
    router.get('/user/activation/:clientAppId/:clientAppSecret/:user/:activationCode',
        controller.actionActivation
    );
    router.put('/user/password-regeneration/:clientAppId/:clientAppSecret/:username',
        controller.actionPasswordRegeneration
    );

    router.delete('/user/:user',
        passport.authenticate('bearer', { session: false }),
        controller.actionRemove
    );
    router.get('/user/profile/:user',
        passport.authenticate('bearer', { session: false }),
        controller.actionGetProfile
    );
    router.put('/user/profile/:user',
        passport.authenticate('bearer', { session: false }),
        controller.actionUpdateProfile
    );
    router.get('/user/my-profile',
        passport.authenticate('bearer', { session: false }),
        controller.actionGetMyProfile
    );
    router.put('/user/push-company/:user/:company',
        passport.authenticate('bearer', { session: false }),
        controller.actionPushCompany
    );
    router.put('/user/unset-company/:user/:company',
        passport.authenticate('bearer', { session: false }),
        controller.actionUnsetCompany
    );
    router.post('/user/insert-company-user/:role/:company',
        passport.authenticate('bearer', { session: false }),
        controller.actionInsertCompanyUser
    );
};
