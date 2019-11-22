const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Service = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Note company is required'],
    },
    title: {
        type: String,
        required: [true, 'Service title is required'],
    },
    description: {
        type: String,
        required: [true, 'Service description is required'],
    },
    image: {
        type: String,
        required: [true, 'Service image is required'],
    },
    price: {
        type: Number,
        required: [true, 'Service price is required'],
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Service', Service);
