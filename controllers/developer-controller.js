const validator = require('validator');
const model = require('../models/user-model');
const UserController = require('./user-controller');
const clientAppModel = require('../models/client-app-model').ClientAppModel;
const config = require('../config');
const responseSender = require('./tools/response-sender');
const logger = require('./tools/logger');
const generateRandomString = require('../tools/string-utils').generateRandomString;


function validateClientApp(clientApp, callback) {
    if (!clientApp) {
        return callback(new Error('No information about the client application'));
    }
    if (!clientApp.name) {
        return callback(new Error('No information about the client application name'));
    }
    if (!clientApp.domain) {
        return callback(new Error('No information about the client application domain'));
    }
    if (!validator.isURL(clientApp.domain)) {
        return callback(new Error('Invalid client application domain'));
    }
    return callback();
}

module.exports = {
    actionRegistration: (req, res) => {
        validateClientApp(req.body.clientApp, (clientAppValidationError) => {
            if (clientAppValidationError) {
                return responseSender.sendError(req, res, clientAppValidationError, null, 400);
            }
            const userInfo = Object.assign({ role: 'developer' }, req.body);

            UserController.insertUser(userInfo, (userSaveError, instance) => {
                logger.push(model.modelName, instance, 'save', userSaveError);
                if (userSaveError) {
                    return responseSender.sendError(req, res, userSaveError, model.modelName, 400);
                }
                let link = `${config.get('protocol')}://${config.get('domain')}:${config.get('port')}`;

                link += '/api/developer/activation/';
                link += `${instance._id}/${instance.activationCode}?`;
                link += `clientApp[name]=${encodeURIComponent(req.body.clientApp.name)}&`;
                link += `clientApp[domain]=${encodeURIComponent(req.body.clientApp.domain)}`;

                return res.send(link);
            });
        });
    },

    actionActivation: (req, res) => {
        validateClientApp(req.query.clientApp, (clientAppValidationError) => {
            if (clientAppValidationError) {
                return responseSender.sendError(req, res, clientAppValidationError, null, 400);
            }
            model.findOneAndUpdate(
                { _id: req.params.user, activationCode: req.params. activationCode },
                { active: true },
                (error, userInstance) => {
                    if (error) {
                        return responseSender.sendError(req, res, error, model.modelName, 400);
                    }
                    if (!userInstance) {
                        return responseSender.sendError(req, res, new Error('User not found'), model.modelName, 400);
                    }
                    logger.push(model.modelName, userInstance, 'activation', null);

                    const clientApp = Object.assign(req.query.clientApp, {
                        clientSecret: generateRandomString(24),
                        developer: req.params.user,
                    });
                    const clientAppInstance = new clientAppModel(clientApp);

                    return clientAppInstance.save((cleintAppCreationError) => {
                        logger.push(clientAppModel.modelName, clientAppInstance, 'save', cleintAppCreationError);
                        return cleintAppCreationError ?
                            responseSender.sendError(req, res, cleintAppCreationError, clientAppModel.modelName, 400) :
                            responseSender.sendSuccess(req, res, model.modelName, userInstance);
                    });
                });
        });
    },
};
