const model = require('../models/note-model').Note;
const contentModels = require('../models/note-model').contentModels;
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

            const query = model.find({}).populate('content').populate('author', 'username');

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
        model.findById(req.params.id).populate('content').exec((err, instance) => {
            if (err || !instance) {
                const error = !err ? new Error(`${model.modelName} ${req.params.id} is undefined`) : err;

                return responseSender.sendError(req, res, error, model.modelName, 404);
            }
            RBAC.getInstance(req.user, 'read', model.modelName)
                .checkCompany(instance.company)
                .checkOwner(instance.author).exec(accessError =>
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
            const contentModel = contentModels[req.params.contentType];

            if (!contentModel) {
                const error = new Error(`${model.modelName} contentType ${req.params.contentType} is undefined`);

                return responseSender.sendError(req, res, error, '', 404);
            }
            return contentModel.create(req.body, (contentCreationError, contentInstance) => {
                if (contentCreationError) {
                    logger.push(
                        contentModel.modelName, contentInstance, 'create', contentCreationError
                    );
                    return responseSender.sendError(
                        req, res, contentCreationError, contentModel.modelName, 500
                    );
                }
                return model.create(
                    {
                        company: req.params.company,
                        author: req.user._id,
                        contentType: req.params.contentType,
                        content: contentInstance._id,
                    },
                    (noteCreationError, noteInstance) => {
                        if (noteCreationError) {
                            contentInstance.remove((contentDeletionError) => {
                                if (contentDeletionError) {
                                    logger.push(
                                        contentModel.modelName, contentInstance, 'remove', contentDeletionError
                                    );
                                }
                            });
                            logger.push(
                                model.modelName, noteInstance, 'create', noteCreationError
                            );
                            return responseSender.sendError(
                                req, res, noteCreationError, model.modelName, 500
                            );
                        }
                        logger.push(model.modelName, noteInstance, 'create');
                        return responseSender.sendSuccess(req, res, model.modelName, noteInstance);
                    }
                );
            });
        });
    },

    actionUpdate: (req, res) => {
        model.findById(req.params.id, (noteFindError, noteInstance) => {
            if (noteFindError || !noteInstance) {
                const error = !noteFindError ?
                    new Error(`${model.modelName} ${req.params.id} is undefined`) : noteFindError;

                return responseSender.sendError(
                    req, res, error, model.modelName, 404
                );
            }
            RBAC.getInstance(req.user, 'update', model.modelName)
                .checkCompany(noteInstance.company)
                .checkOwner(noteInstance.author).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }

                    const contentModel = contentModels[noteInstance.contentType];

                    if (!contentModel) {
                        const error = new Error(`${model.modelName} contentType ${req.body.contentType} is undefined`);

                        return responseSender.sendError(req, res, error, '', 404);
                    }

                    return contentModel.findById(noteInstance.content, (contentFindError, contentInstance) => {
                        if (contentFindError || !contentInstance) {
                            const error = !contentFindError ?
                                new Error(`${model.modelName} content ${noteInstance.content} is undefined`) :
                                contentFindError;

                            return responseSender.sendError(
                                req, res, error, contentModel.modelName, 404
                            );
                        }
                        Object.assign(contentInstance, req.body);
                        return contentInstance.save((contentSavingError) => {
                            logger.push(contentModel.modelName, contentInstance, 'save', contentSavingError);
                            return contentSavingError ?
                                responseSender.sendError(req, res, contentSavingError, model.modelName, 500) :
                                responseSender.sendSuccess(req, res, model.modelName, noteInstance);
                        });
                    });
                });
        });
    },

    actionRemove: (req, res) => {
        model.findById(req.params.id, (noteFindError, noteInstance) => {
            if (noteFindError || !noteInstance) {
                const error = !noteFindError ?
                    new Error(`${model.modelName} ${req.params.id} is undefined`) : noteFindError;

                return responseSender.sendError(
                    req, res, error, model.modelName, 404
                );
            }

            RBAC.getInstance(req.user, 'remove', model.modelName)
                .checkCompany(noteInstance.company)
                .checkOwner(noteInstance.author).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }

                    const contentModel = contentModels[noteInstance.contentType];

                    if (!contentModel) {
                        const error = new Error(`${model.modelName} contentType ${req.body.contentType} is undefined`);

                        return responseSender.sendError(req, res, error, '', 404);
                    }

                    return contentModel.findById(noteInstance.content, (contentFindError, contentInstance) => {
                        if (contentFindError) {
                            const error = !contentFindError ?
                                new Error(`${model.modelName} content ${noteInstance.content} is undefined`) :
                                contentFindError;

                            return responseSender.sendError(
                                req, res, error, contentModel.modelName, 404
                            );
                        }
                        return contentInstance.remove((contentDeletionError) => {
                            if (contentDeletionError) {
                                logger.push(
                                    contentModel.modelName, contentInstance, 'remove', contentDeletionError
                                );
                                return responseSender.sendError(
                                    req, res, contentDeletionError, contentModel.modelName, 500
                                );
                            }
                            return noteInstance.remove((noteDeletionError) => {
                                if (noteDeletionError) {
                                    logger.push(
                                        model.modelName, noteInstance, 'remove', noteDeletionError
                                    );
                                    return responseSender.sendError(
                                        req, res, noteDeletionError, model.modelName, 500
                                    );
                                }
                                logger.push(model.modelName, noteInstance, 'remove');
                                return responseSender.sendSuccess(req, res, model.modelName, noteInstance);
                            });
                        });
                    });
                });
        });
    },
};
