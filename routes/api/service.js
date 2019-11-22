const passport = require('passport');
const controller = require('../../controllers/service-controller');

module.exports = (router) => {
    router.get('/service/collection/:company',
        passport.authenticate('bearer', { session: false }),
        controller.actionGetCollection
    );

    router.get('/service/:id',
        passport.authenticate('bearer', { session: false }),
        controller.actionGetInstance
    );

    router.post('/service/:company',
        passport.authenticate('bearer', { session: false }),
        controller.actionInsert
    );

    router.put('/service/:id',
        passport.authenticate('bearer', { session: false }),
        controller.actionUpdate
    );

    router.delete('/service/:id',
        passport.authenticate('bearer', { session: false }),
        controller.actionRemove
    );
};
