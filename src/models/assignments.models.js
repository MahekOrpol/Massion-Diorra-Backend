const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
//test

const assignmentsSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        assignmentSummary: {
            type: String,
            required: true,
            trim: true,
        },
        startDate: {
            type: String,
        },
        endDate: {
            type: String,
        },
        projectDescription: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        }]
    }, {
    timestamps: true,
}
)

assignmentsSchema.plugin(toJSON);
/**
 * @typedef Assignments
 */
const Assignments = mongoose.model('Assignments', assignmentsSchema);

module.exports = Assignments;