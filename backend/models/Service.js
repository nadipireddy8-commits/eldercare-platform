const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    duration: String,
    price: Number,
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Service', ServiceSchema);