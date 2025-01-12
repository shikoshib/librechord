const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Comment = new Schema({
    username: { type: String, required: true },
    uploadDate: { type: Date, required: true },
    content: { type: String, required: true },
    audio: { type: String, required: true }
})

module.exports = Comment;