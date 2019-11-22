const mongoose = require('mongoose');
const validator = require('validator');

const Schema = mongoose.Schema;

const UserProfile = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'UserProfile user is required'],
    },
    name: {
        type: String,
        required: [true, 'UserProfile name is required'],
    },
    surname: {
        type: String,
        required: [true, 'UserProfile surname is required'],
    },
    email: {
        type: String,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email!',
        },
    },
    phone: String,
    webs: {
        gplus: String,
        fb: String,
        vk: String,
        ok: String,
    },
    messangers: {
        skype: String,
    },
    userpic: String,
    created: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('UserProfile', UserProfile);
