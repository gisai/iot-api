const mongoose = require('mongoose');

const userGroupSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    url: String,
    name: { type: String, required: true },
    description: { type: String, default: 'Sin descripción' },
    devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
    displays: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Display' }],
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('UserGroup', userGroupSchema);
