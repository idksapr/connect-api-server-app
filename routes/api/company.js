const passport = require('passport');
const controller = require('../../controllers/company-controller');

module.exports = (router) => {
    router.get('/company/collection',
        passport.authenticate('bearer', { session: false }),
        controller.actionGetCollection
    );

    router.get('/company/my-companies',
        passport.authenticate('bearer', { session: false }),
        controller.actionGetMyCompanies
    );

    router.get('/company/:id', controller.actionGetInstance);

    router.post('/company',
        passport.authenticate('bearer', { session: false }),
        controller.actionInsert
    );

    router.put('/company/:id',
        passport.authenticate('bearer', { session: false }),
        controller.actionUpdate
    );

    router.delete('/company/:id',
        passport.authenticate('bearer', { session: false }),
        controller.actionRemove
    );
};
