const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const config = require('../config');

const Schema = mongoose.Schema;

const User = new Schema({
    username: {
        type: String,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email!',
        },
        required: [true, 'User username is required'],
    },
    hashedPassword: {
        type: String,
        required: [true, 'User hashedPassword is required'],
    },
    salt: {
        type: String,
        required: [true, 'User salt is required'],
    },
    role: {
        type: String,
        validate: {
            validator: role => (config.get('userRoles').indexOf(role) >= 0),
            message: '{VALUE} is not a valid user role!',
        },
        required: [true, 'User role is required'],
    },
    companies: [ {
        type: Schema.Types.ObjectId,
        ref: 'Company',
    } ],
    active: {
        type: Boolean,
        required: [true, 'User active is required'],
        default: false,
    },
    activationCode: {
        type: String,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

User.virtual('userId')
    .get(function () {
        return this.id;
    });

User.virtual('password')
    .set(function (password) {
        this._plainPassword = password;
        this.salt = crypto.randomBytes(32).toString('base64');
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function () {
        return this._plainPassword;
    });

User.methods.encryptPassword = function (password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

User.methods.checkPassword = function (password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

module.exports = mongoose.model('User', User);
