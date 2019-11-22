const mongoose = require('mongoose');
const validator = require('validator');
const config = require('../config');

const Schema = mongoose.Schema;

const Company = new Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
    },
    str_id: {
        type: String,
        unique: true,
        set: strId => strId.toLowerCase(),
        validate: {
            validator: strId => /^[\w-]+$/.test(strId),
            message: '{VALUE} is not contains only letters (a-zA-Z) and numbers',
        },
        required: [true, 'Company string id is required'],
    },
    description: {
        type: String,
        required: [true, 'Company description is required'],
    },
    image: {
        type: String,
        required: [true, 'Company image is required'],
    },
    currency: {
        type: String,
        set: currency => currency.toUpperCase(),
        validate: {
            validator: currency => (config.get('currencies').indexOf(currency) >= 0),
            message: '{VALUE} is not a valid currency!',
        },
        required: [true, 'Company currency is required'],
    },
    phone: {
        type: String,
        required: [true, 'Company phone is required'],
    },
    email: {
        type: String,
        required: [true, 'Company email is required'],
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email!',
        },
    },
    address: {
        country: {
            type: String,
            required: [true, 'Company country is required'],
        },
        city: {
            type: String,
            required: [true, 'Company city is required'],
        },
        street: {
            type: String,
            required: [true, 'Company street is required'],
        },
        house: {
            type: String,
            required: [true, 'Company house is required'],
        },
        office: String,
    },
    coords: {
        type: [ Number ],
        index: '2dsphere',
        required: [true, 'Company coords is required'],
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    webs: {
        site: {
            type: String,
            validate: {
                validator: validator.isURL,
                message: '{VALUE} is not a valid url!',
            },
        },
        gplus: String,
        fb: String,
        vk: String,
        ok: String,
    },
    messangers: {
        skype: String,
    },
    active: {
        type: Boolean,
        default: true,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

Company.virtual('address.full')
    .get(function () {
        const addressChunks = [
            this.address.country,
            this.address.city,
            this.address.street,
            this.address.house,
        ];

        if (this.address.office) {
            addressChunks.push(this.address.office);
        }

        return addressChunks.join(', ');
    });

Company.set('toObject', { getters: true });
Company.set('toJSON', { getters: true });

module.exports = mongoose.model('Company', Company);
