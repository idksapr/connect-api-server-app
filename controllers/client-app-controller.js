const model = require('../models/client-app-model').ClientAppModel;
const RBAC = require('./tools/rbac');
const responseSender = require('./tools/response-sender');
const logger = require('./tools/logger');
const generateRandomString = require('../tools/string-utils').generateRandomString;

module.exports = {
    actionGetCollection: (req, res) => {
        RBAC.getInstance(req.user, 'read', model.modelName).exec(accessError => {
            if (accessError) {
                return responseSender.sendError(req, res, accessError, model.modelName, 403);
            }

            const filter = req.query.filter ? req.query.filter : {};
            const sort = req.query.sort ? req.query.sort : {};
            const limit = req.query.limit ? req.query.limit : 0;
            const skip = req.query.page ? limit * req.query.page : 0;

            if (req.user.role === 'developer') {
                filter.developer = req.user._id;
            }

            const query = model.find();

            try {
                query.where(filter).sort(sort).limit(limit).skip(skip);
            } catch (queryError) {
                return responseSender.sendError(req, res, queryError, model.modelName, 404);
            }

            query.exec((err, collection) => {
                if (err || !collection) {
                    const error = !err ? new Error(`${model.modelName} collection is undefined`) : err;

                    return responseSender.sendError(req, res, error, model.modelName, 404);
                }
                return responseSender.sendSuccess(req, res, model.modelName, collection);
            });
        });
    },

    actionGetInstance: (req, res) => {
        model.findById(req.params.id).exec((err, instance) => {
            if (err || !instance) {
                const error = !err ? new Error(`${model.modelName} ${req.params.id} is undefined`) : err;

                return responseSender.sendError(req, res, error, model.modelName, 404);
            }
            RBAC.getInstance(req.user, 'read', model.modelName)
                .checkOwner(instance._id).exec(accessError =>
                    (accessError ?
                        responseSender.sendError(req, res, accessError, model.modelName, 403) :
                        responseSender.sendSuccess(req, res, model.modelName, instance))
                );
        });
    },

    actionInsert: (req, res) => {
        RBAC.getInstance(req.user, 'insert', model.modelName).exec(accessError => {
            if (accessError) {
                return responseSender.sendError(req, res, accessError, model.modelName, 403);
            }
            const body = Object.assign({}, req.body, {
                clientSecret: generateRandomString(24),
                developer: req.user._id,
            });
            const instance = new model(body);

            return instance.save((error) => {
                logger.push(model.modelName, instance, 'save', error);
                return error ?
                    responseSender.sendError(req, res, error, model.modelName, 400) :
                    responseSender.sendSuccess(req, res, model.modelName, instance);
            });
        });
    },

    actionRemove: (req, res) => {
        model.findById(req.params.id, (findError, instance) => {
            if (findError || !instance) {
                const error = !findError ?
                    new Error(`${model.modelName} ${req.params.id} is undefined`) : findError;

                return responseSender.sendError(
                    req, res, error, model.modelName, 404
                );
            }

            RBAC.getInstance(req.user, 'remove', model.modelName)
                .checkOwner(instance.developer).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }
                    return instance.remove((deletionError) => {
                        if (deletionError) {
                            logger.push(model.modelName, instance, 'remove', deletionError);
                            return responseSender.sendError(req, res, deletionError, model.modelName, 400);
                        }
                        logger.push(model.modelName, instance, 'remove');
                        return responseSender.sendSuccess(req, res, model.modelName, instance);
                    });
                });
        });
    },
};
