const mongoose = require('mongoose');
const validator = require('validator');

const Schema = mongoose.Schema;

const ClientApp = new Schema({
    name: {
        type: String,
        required: [true, 'Client App name is required'],
    },
    clientSecret: {
        type: String,
        required: [true, 'Client App secret is required'],
    },
    domain: {
        type: String,
        unique: true,
        validate: {
            validator: validator.isURL,
            message: '{VALUE} is not a valid url!',
        },
    },
    developer : {
        type: String,
        required: [true, 'Client App developer is required'],
    },
});

const AccessToken = new Schema({
    userId: {
        type: String,
        required: true,
    },
    clientId: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        unique: true,
        required: true,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

const RefreshToken = new Schema({
    userId: {
        type: String,
        required: true,
    },
    clientId: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        unique: true,
        required: true,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

module.exports.ClientAppModel = mongoose.model('ClientApp', ClientApp);
module.exports.AccessTokenModel = mongoose.model('AccessToken', AccessToken);
module.exports.RefreshTokenModel = mongoose.model('RefreshToken', RefreshToken);
