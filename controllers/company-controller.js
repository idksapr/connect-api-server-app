const model = require('../models/company-model');
const RBAC = require('./tools/rbac');
const responseSender = require('./tools/response-sender');
const logger = require('./tools/logger');
const userController = require('./user-controller');

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

    actionGetMyCompanies: (req, res) => {
        model.find().where('_id').in(req.user.companies).exec((err, collection) => {
            if (err || !collection) {
                const error = !err ? new Error(`${model.modelName} collection is undefined`) : err;

                return responseSender.sendError(req, res, error, model.modelName, 404);
            }
            return responseSender.sendSuccess(req, res, model.modelName, collection);
        });
    },

    actionGetInstance: (req, res) => {
        model.findById(req.params.id).exec((err, instance) => {
            if (err || !instance) {
                const error = !err ? new Error(`${model.modelName} ${req.params.id} is undefined`) : err;

                logger.push(model.modelName, instance, 'get_instance', error);
                return responseSender.sendError(req, res, error, model.modelName, 404);
            }
            RBAC.getInstance(req.user, 'read', model.modelName)
                .checkCompany(instance._id).exec(accessError =>
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
            const instance = new model(req.body);

            return instance.save((savingError) => {
                if (savingError) {
                    return responseSender.sendError(req, res, savingError, model.modelName, 500);
                }
                logger.push(model.modelName, instance, 'save', savingError);

                userController.pushCompany(req.user, instance._id, (pushCompanyError) => {
                    if (pushCompanyError) {
                        return responseSender.sendError(req, res, pushCompanyError, model.modelName, 500);
                    }
                    return responseSender.sendSuccess(req, res, model.modelName, instance);
                });
            });
        });
    },

    actionUpdate: (req, res) => {
        model.findById(req.params.id, (findError, instance) => {
            if (findError || !instance) {
                const error = !findError ?
                    new Error(`${model.modelName} ${req.params.id} is undefined`) : findError;

                logger.push(model.modelName, instance, 'save', error);
                return responseSender.sendError(
                    req, res, error, model.modelName, 404
                );
            }
            RBAC.getInstance(req.user, 'update', model.modelName)
                .checkCompany(instance._id).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }
                    Object.assign(instance, req.body);
                    return instance.save((savingError) => {
                        logger.push(model.modelName, instance, 'save', savingError);
                        return savingError ?
                            responseSender.sendError(req, res, savingError, model.modelName, 500) :
                            responseSender.sendSuccess(req, res, model.modelName, instance);
                    });
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
                .checkCompany(instance._id).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }
                    return instance.remove((deletionError) => {
                        if (deletionError) {
                            logger.push(this.model.modelName, instance, 'remove', deletionError);
                            return responseSender.sendError(req, res, deletionError, this.model.modelName, 500);
                        }
                        logger.push(this.model.modelName, instance, 'remove');
                        return responseSender.sendSuccess(req, res, this.model.modelName, instance);
                    });
                });
        });
    },
};
