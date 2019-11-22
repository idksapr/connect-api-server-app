const model = require('../models/user-model');
const UserProfileModel = require('../models/user-profile-model');
const clientAppModel = require('../models/client-app-model').ClientAppModel;
const companyModel = require('../models/company-model');
const RBAC = require('./tools/rbac');
const responseSender = require('./tools/response-sender');
const logger = require('./tools/logger');
const config = require('../config');
const generateRandomString = require('../tools/string-utils').generateRandomString;


function validateRegistrationRole(role) {
    return (['company_admin', 'client'].indexOf(role) !== -1);
}

function insertUser(userInfo, callback) {
    const userInstance = new model();

    userInstance.username = userInfo.username;
    userInstance.role = userInfo.role;
    userInstance.password = generateRandomString(8);
    userInstance.activationCode = generateRandomString(24);

    console.log(userInstance.password);

    return userInstance.save((userSaveError) => {
        if (userSaveError) {
            return callback(userSaveError, userInstance);
        }

        const userProfile = Object.assign(
            { user: userInstance._id, email: userInstance.username },
            (userInfo.profile ? userInfo.profile : {})
        );
        const userProfileInstance = new UserProfileModel(userProfile);

        return userProfileInstance.save((userProfileSaveError) => {
            return callback(userProfileSaveError, userInstance);
        });
    });
}

function pushCompany(userInstance, companyId, callback) {
    companyModel.findById(companyId, (companyFindError, companyInstance) => {
        if (companyFindError) {
            return callback(companyFindError, companyInstance);
        }
        if (!companyInstance) {
            return callback(new Error(`Company ${companyId} not found`), companyInstance);
        }
        if (userInstance.companies.some((userCompanyId) => (companyId.toString() === userCompanyId.toString()))) {
            return callback(new Error(`User ${userInstance._id} already belongs to company ${companyId}`), companyInstance);
        }
        userInstance.companies.push(companyInstance._id);

        userInstance.save((userSaveError, userInstanceAfterPushCompany) => {
            if (userSaveError) {
                return callback(userSaveError, userInstanceAfterPushCompany);
            }
            callback(null, userInstanceAfterPushCompany);
        });
    });
}

function unsetCompany(userInstance, companyId, callback) {
    companyModel.findById(companyId, (companyFindError, companyInstance) => {
        if (companyFindError) {
            return callback(companyFindError, companyInstance);
        }
        if (!companyInstance) {
            return callback(new Error(`Company ${companyId} not found`), companyInstance);
        }
        userInstance.companies = userInstance.companies.filter((userCompanyId) =>
            userCompanyId.toString() !== companyInstance._id.toString()
        );

        userInstance.save((userSaveError, userInstanceAfterUnsetCompany) => {
            if (userSaveError) {
                return callback(userSaveError, userInstanceAfterUnsetCompany);
            }
            callback(null, userInstanceAfterUnsetCompany);
        });
    });
}

module.exports = {
    insertUser,

    pushCompany,

    actionRegistration: (req, res) => {
        clientAppModel.findOne(
            { '_id': req.params.clientAppId, 'clientSecret': req.params.clientAppSecret },
            (clientAppFindError, clientAppInstance) => {
                if (clientAppFindError) {
                    return responseSender.sendError(req, res, clientAppFindError, clientAppModel.modelName, 400);
                }
                if (!clientAppInstance) {
                    return responseSender.sendError(
                        req, res, new Error('Client app not found'), clientAppModel.modelName, 400
                    );
                }

                if (!validateRegistrationRole(req.params.role)) {
                    return responseSender.sendError(req, res, new Error('Invalid user role'), model.modelName, 400);
                }
                const userInfo = Object.assign({ role: req.params.role }, req.body);

                insertUser(userInfo, (userSaveError, userInstance) => {
                    logger.push(model.modelName, userInstance, 'save', userSaveError);
                    if (userSaveError) {
                        return responseSender.sendError(req, res, userSaveError, model.modelName, 400);
                    }
                    let link = `${config.get('protocol')}://${config.get('domain')}:${config.get('port')}`;

                    link += '/api/user/activation/';
                    link += `${req.params.clientAppId}/${req.params.clientAppSecret}/`;
                    link += `${userInstance._id}/${userInstance.activationCode}`;

                    return res.send(link);
                });
            }
        );
    },

    actionActivation: (req, res) => {
        clientAppModel.findOne(
            { '_id': req.params.clientAppId, 'clientSecret': req.params.clientAppSecret },
            (clientAppFindError, clientAppInstance) => {
                if (clientAppFindError) {
                    return responseSender.sendError(req, res, clientAppFindError, clientAppModel.modelName, 400);
                }
                if (!clientAppInstance) {
                    return responseSender.sendError(
                        req, res, new Error('Client app not found'), clientAppModel.modelName, 400
                    );
                }

                model.findOneAndUpdate(
                    { _id: req.params.user, activationCode: req.params. activationCode },
                    { active: true },
                    (userFindError, userInstance) => {
                        if (userFindError) {
                            return responseSender.sendError(req, res, userFindError, model.modelName, 400);
                        }
                        if (!userInstance) {
                            return responseSender.sendError(req, res, new Error('User not found'), model.modelName, 400);
                        }
                        logger.push(model.modelName, userInstance, 'activation', null);
                        responseSender.sendSuccess(req, res, model.modelName, userInstance);
                    }
                );
            }
        );
    },

    actionPasswordRegeneration: (req, res) => {
        clientAppModel.findOne(
            { '_id': req.params.clientAppId, 'clientSecret': req.params.clientAppSecret },
            (clientAppFindError, clientAppInstance) => {
                if (clientAppFindError) {
                    return responseSender.sendError(req, res, clientAppFindError, clientAppModel.modelName, 400);
                }
                if (!clientAppInstance) {
                    return responseSender.sendError(
                        req, res, new Error('Client app not found'), clientAppModel.modelName, 400
                    );
                }
                model.findOne({ username: req.params.username }, (userFindError, userInstance) => {
                    if (userFindError) {
                        return responseSender.sendError(req, res, userFindError, model.modelName, 400);
                    }
                    if (!userInstance) {
                        return responseSender.sendError(req, res, new Error('User not found'), model.modelName, 400);
                    }
                    userInstance.password = generateRandomString(8);

                    console.log(userInstance.password);

                    userInstance.save((userSaveError) => {
                        if (userSaveError) {
                            return responseSender.sendError(req, res, userSaveError, model.modelName, 400);
                        }
                        logger.push(model.modelName, userInstance, 'password-regeneration', null);
                        responseSender.sendSuccess(req, res, model.modelName, userInstance);
                    });
                });
            }
        );
    },

    actionPushCompany: (req, res) => {
        model.findById(req.params.user, (userFindError, userInstance) => {
            if (userFindError) {
                return responseSender.sendError(req, res, userFindError, model.modelName, 400);
            }
            if (!userInstance) {
                return responseSender.sendError(
                    req, res, new Error(`User ${req.params.user} not found`), model.modelName, 400
                );
            }
            RBAC.getInstance(req.user, 'push_unset_company', `${model.modelName}:${userInstance.role}`)
                .checkCompany(req.params.company)
                .checkOwner(userInstance._id).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }
                    pushCompany(userInstance, req.params.company, (pushCompanyError, userInstanceAfterPushCompany) => {
                        if (pushCompanyError) {
                            return responseSender.sendError(req, res, pushCompanyError, model.modelName, 400);
                        }
                        logger.push(model.modelName, userInstanceAfterPushCompany, 'push-company', null);
                        responseSender.sendSuccess(req, res, model.modelName, userInstanceAfterPushCompany);
                    });
                }
            );
        });
    },

    actionUnsetCompany: (req, res) => {
        model.findById(req.params.user, (userFindError, userInstance) => {
            if (userFindError) {
                return responseSender.sendError(req, res, userFindError, model.modelName, 400);
            }
            if (!userInstance) {
                return responseSender.sendError(
                    req, res, new Error(`User ${req.params.user} not found`), model.modelName, 400
                );
            }
            RBAC.getInstance(req.user, 'push_unset_company', `${model.modelName}:${userInstance.role}`)
                .checkCompany(req.params.company)
                .checkOwner(userInstance._id).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }
                    unsetCompany(userInstance, req.params.company, (unsetCompanyError, userInstanceAfterUnsetCompany) => {
                        if (unsetCompanyError) {
                            return responseSender.sendError(req, res, unsetCompanyError, model.modelName, 400);
                        }
                        logger.push(model.modelName, userInstanceAfterUnsetCompany, 'unset-company', null);
                        responseSender.sendSuccess(req, res, model.modelName, userInstanceAfterUnsetCompany);
                    });
                }
            );
        });
    },

    actionInsertCompanyUser: (req, res) => {
        RBAC.getInstance(req.user, 'insert', `${model.modelName}:${req.params.role}`)
            .checkCompany(req.params.company)
            .exec(accessError => {
                if (accessError) {
                    return responseSender.sendError(req, res, accessError, model.modelName, 403);
                }
                const userInfo = Object.assign({ role: req.params.role, active: true }, req.body);

                insertUser(userInfo, (userSaveError, userInstance) => {
                    logger.push(model.modelName, userInstance, 'save', userSaveError);
                    if (userSaveError) {
                        return responseSender.sendError(req, res, userSaveError, model.modelName, 400);
                    }
                    pushCompany(userInstance, req.params.company, (pushCompanyError, userInstanceAfterPushCompany) => {
                        if (pushCompanyError) {
                            return responseSender.sendError(req, res, pushCompanyError, model.modelName, 400);
                        }
                        logger.push(model.modelName, userInstanceAfterPushCompany, 'push-company', null);
                        responseSender.sendSuccess(req, res, model.modelName, userInstanceAfterPushCompany);
                    });
                });
            });
    },

    actionRemove: (req, res) => {
        model.findById(req.params.user, (userFindError, userInstance) => {
            if (userFindError || !userInstance) {
                const error = !userFindError ?
                    new Error(`${model.modelName} ${req.params.id} is undefined`) : userFindError;

                return responseSender.sendError(req, res, error, model.modelName, 404);
            }

            RBAC.getInstance(req.user, 'remove', `${model.modelName}:${userInstance.role}`)
                .checkOwner(userInstance._id).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }
                    return UserProfileModel.findOne({ user: userInstance._id }, (userProfileFindError, userProfileInstance) => {
                        if (userProfileFindError || !userProfileInstance) {
                            const error = !userProfileFindError ?
                                new Error(`${model.modelName} ${req.params.id} is undefined`) : userProfileFindError;

                            return responseSender.sendError(req, res, error, model.modelName, 404);
                        }
                        return userProfileInstance.remove((userProfileRemoveError) => {
                            if (userProfileRemoveError) {
                                logger.push(model.modelName, userProfileInstance, 'remove', userProfileRemoveError);
                                return responseSender.sendError(
                                    req, res, userProfileRemoveError, model.modelName, 500
                                );
                            }
                            logger.push(model.modelName, userProfileInstance, 'remove');
                            return userInstance.remove((userRemoveError) => {
                                if (userRemoveError) {
                                    logger.push(model.modelName, userInstance, 'remove', userRemoveError);
                                    return responseSender.sendError(
                                        req, res, userRemoveError, model.modelName, 500
                                    );
                                }
                                logger.push(model.modelName, userInstance, 'remove');
                                return responseSender.sendSuccess(req, res, model.modelName, userInstance);
                            });
                        });
                    });
                });
        });
    },

    actionGetProfile: (req, res) => {
        model.findById(req.params.user, (userFindError, userInstance) => {
            if (userFindError || !userInstance) {
                const error = !userFindError ?
                    new Error(`${model.modelName} ${req.params.user} is undefined`) : userFindError;

                return responseSender.sendError(req, res, error, model.modelName, 404);
            }
            RBAC.getInstance(req.user, 'read', `${model.modelName}:${userInstance.role}`)
                .checkOwner(userInstance._id).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }
                    return UserProfileModel.findOne({ user: userInstance._id }, (userProfileFindError, userProfileInstance) => {
                        if (userProfileFindError || !userProfileInstance) {
                            const error = !userProfileFindError ?
                                new Error(`${UserProfileModel.modelName} ${userInstance._id} is undefined`) :
                                userProfileFindError;

                            return responseSender.sendError(req, res, error, UserProfileModel.modelName, 404);
                        }
                        return responseSender.sendSuccess(req, res, UserProfileModel.modelName, userProfileInstance);
                    });
                });
        });
    },

    actionGetMyProfile: (req, res) => {
        UserProfileModel.findOne({ user: req.user._id }, (userProfileFindError, userProfileInstance) => {
            if (userProfileFindError || !userProfileInstance) {
                const error = !userProfileFindError ?
                    new Error(`${UserProfileModel.modelName} ${req.user._id} is undefined`) :
                    userProfileFindError;

                return responseSender.sendError(req, res, error, UserProfileModel.modelName, 404);
            }
            return responseSender.sendSuccess(req, res, UserProfileModel.modelName, userProfileInstance);
        });
    },

    actionUpdateProfile: (req, res) => {
        model.findById(req.params.user, (userFindError, userInstance) => {
            if (userFindError || !userInstance) {
                const error = !userFindError ?
                    new Error(`${model.modelName} ${req.params.user} is undefined`) : userFindError;

                return responseSender.sendError(req, res, error, model.modelName, 404);
            }
            RBAC.getInstance(req.user, 'update', `${model.modelName}:${userInstance.role}`)
                .checkOwner(userInstance._id).exec(accessError => {
                    if (accessError) {
                        return responseSender.sendError(req, res, accessError, model.modelName, 403);
                    }
                    return UserProfileModel.findOne({ user: userInstance._id }, (userProfileFindError, userProfileInstance) => {
                        if (userProfileFindError || !userProfileInstance) {
                            const error = !userProfileFindError ?
                                new Error(`${UserProfileModel.modelName} ${userInstance._id} is undefined`) :
                                userProfileFindError;

                            return responseSender.sendError(req, res, error, UserProfileModel.modelName, 404);
                        }
                        Object.assign(userProfileInstance, req.body);
                        return userProfileInstance.save((userProfileSavingError) => {
                            logger.push(UserProfileModel.modelName, userProfileInstance, 'save', userProfileSavingError);
                            return userProfileSavingError ?
                                responseSender.sendError(req, res, userProfileSavingError, UserProfileModel.modelName, 500) :
                                responseSender.sendSuccess(req, res, UserProfileModel.modelName, userProfileInstance);
                        });
                    });
                });
        });
    },
};
