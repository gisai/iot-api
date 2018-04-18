const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    url: String,
    name: { type: String, default: "Dispositivo no configurado"},
    description: { type: String, default: "Sin descripción" },
    mac: String,
    mac_address: String,
    screen: String,
    batt: String,
    rssi: String,
    init_code: String,
    found: Boolean,
    pref_gateway: { type: mongoose.Schema.Types.ObjectId, ref: 'Gateway' },
    display: { type: mongoose.Schema.Types.ObjectId, ref: 'Display' },
    resolution: { type: mongoose.Schema.Types.ObjectId, ref: 'Resolution' },
    userGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup' },
    gateway: { type: mongoose.Schema.Types.ObjectId, ref: 'Gateway' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Device', deviceSchema);
