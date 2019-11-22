const passport = require('passport');
const controller = require('../../controllers/note-controller');

module.exports = (router) => {
    router.get('/note/collection/:company',
        controller.actionGetCollection
    );

    router.get('/note/:id',
        controller.actionGetInstance
    );

    router.post('/note/:company/:contentType',
        passport.authenticate('bearer', { session: false }),
        controller.actionInsert
    );

    router.put('/note/:id',
        passport.authenticate('bearer', { session: false }),
        controller.actionUpdate
    );

    router.delete('/note/:id',
        passport.authenticate('bearer', { session: false }),
        controller.actionRemove
    );
};
