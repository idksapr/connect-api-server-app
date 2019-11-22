const model = require('../models/service-model');
const RBAC = require('./tools/rbac');
const responseSender = require('./tools/response-sender');
const logger = require('./tools/logger');

module.exports = {
    actionGetCollection: (req, res) => {
        RBAC.getInstance(req.user, 'read', model.modelName).checkCompany(req.params.company).exec(accessError => {
            if (accessError) {
                return responseSender.sendError(req, res, accessError, model.modelName, 403);
            }

            const filter = req.query.filter ? req.query.filter : {};
            const sort = req.query.sort ? req.query.sort : {};
            const limit = req.query.limit ? req.query.limit : 0;
            const skip = req.query.page ? limit * req.query.page : 0;

            if (req.params.company) {
                filter.company = req.params.company;
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
                .checkCompany(instance.company).exec(accessError =>
                    (accessError ?
                        responseSender.sendError(req, res, accessError, model.modelName, 403) :
                        responseSender.sendSuccess(req, res, model.modelName, instance))
                );
        });
    },

    actionInsert: (req, res) => {
        RBAC.getInstance(req.user, 'insert', model.modelName).checkCompany(req.params.company).exec(accessError => {
            if (accessError) {
                return responseSender.sendError(req, res, accessError, model.modelName, 403);
            }
            const body = Object.assign({}, req.body, { company: req.params.company });
            const instance = new model(body);

            return instance.save((error) => {
                logger.push(model.modelName, instance, 'save', error);
                return error ?
                    responseSender.sendError(req, res, error, model.modelName, 500) :
                    responseSender.sendSuccess(req, res, model.modelName, instance);
            });
        });
    },

    actionUpdate: (req, res) => {
        model.findById(req.params.id, (findError, instance) => {
            if (findError || !instance) {
                const error = !findError ?
                    new Error(`${model.modelName} ${req.params.id} is undefined`) : findError;

                return responseSender.sendError(
                    req, res, error, model.modelName, 404
                );
            }
            RBAC.getInstance(req.user, 'update', model.modelName)
                .checkCompany(instance.company).exec(accessError => {
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
                .checkCompany(instance.company).exec(accessError => {
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
