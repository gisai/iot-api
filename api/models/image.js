const mongoose = require('mongoose');

const imageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    url: String,
    id: Number,
    name: String,
    description: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    user: String,
    src_url: String,
    file: String,
    color_profile: String,
    dimensions:{
      width: Number,
      height: Number
    },
    size: Number,
    category: String,
    tags_total: Number,
    tags:[String],
    displays:[
      {
        _id: mongoose.Schema.Types.ObjectId,
        url: String,
        id: Number,
        name: String
      }
    ],
    groups:[
      {
        _id: mongoose.Schema.Types.ObjectId,
        url: String,
        id: Number,
        name: String
      }
    ]
});

module.exports = mongoose.model('Image', imageSchema);