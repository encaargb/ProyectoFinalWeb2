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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Installation', installationSchema);
