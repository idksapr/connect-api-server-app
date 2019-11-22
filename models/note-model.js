const mongoose = require('mongoose');
const deepPopulate = require('mongoose-deep-populate')(mongoose);

const Schema = mongoose.Schema;

const Note = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Note company is required'],
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Note author is required'],
    },
    contentType: {
        type: String,
        enum: ['Post', 'Survey'],
        required: [true, 'Note contentType is required'],
    },
    content: {
        type: Schema.Types.ObjectId,
        refPath: 'contentType',
        required: [true, 'Note content is required'],
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

Note.plugin(deepPopulate);

const Post = new Schema({
    title: {
        type: String,
        required: [true, 'Post title is required'],
    },
    summary: {
        type: String,
        required: [true, 'Post summary is required'],
    },
    description: {
        type: String,
        required: [true, 'Post description is required'],
    },
    image: {
        type: String,
        required: [true, 'Post image is required'],
    },

});

const Survey = new Schema({
    title: {
        type: String,
        required: [true, 'Survey title is required'],
    },
    question: {
        type: String,
        required: [true, 'Survey question is required'],
    },
    questionType: {
        type: String,
        enum: ['singleChoice', 'multipleChoise'],
        required: [true, 'Survey questionType is required'],
    },
    answers: {
        type: Array,
        default: [],
    },
});

exports.Note = mongoose.model('Note', Note);
exports.contentModels = {
    Post: mongoose.model('Post', Post),
    Survey: mongoose.model('Survey', Survey),
};
