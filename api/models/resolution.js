const mongoose = require('mongoose')

const resolutionSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    url: String,
    screen_code: { type: String, required: true },
    color_profile: { type: String, default: 'grayscale' },
    name: { type: String, required: true },
    description: { type: String, default: 'Sin descripción' },
    size:{
       width: { type: Number, default: 0 },
       height: { type: Number, default: 0 }
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

module.exports = mongoose.model('Resolution', resolutionSchema)
