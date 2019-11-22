const passport = require('passport');
const controller = require('../../controllers/client-app-controller');

module.exports = (router) => {
    router.get('/client-app/collection',
        passport.authenticate('bearer', { session: false }),
        controller.actionGetCollection
    );
    router.get('/client-app/:id',
        passport.authenticate('bearer', { session: false }),
        controller.actionGetInstance
    );
    router.post('/client-app',
        passport.authenticate('bearer', { session: false }),
        controller.actionInsert
    );
    router.delete('/client-app/:id',
        passport.authenticate('bearer', { session: false }),
        controller.actionRemove
    );
};
