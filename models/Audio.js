const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Audio = new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    username: { type: String, required: true },
    uploadDate: { type: Date, required: true },
    genre: { type: Number, required: true },
    language: { type: String, required: true },
    duration: { type: Number, required: true },
    listens: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
})

module.exports = Audio;