const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    sports: [
        {
            sportId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            name: {
                type: String,
                required: true
            }
        }
    ],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    externalId: {
        type: String
    },
    source: {
        type: String
    },
    lastUpdated: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Installation', installationSchema);

