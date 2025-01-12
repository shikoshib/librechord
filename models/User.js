const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    displayName: { type: String, default: "" },
    joinedDate: { type: Date, required: true },
    likes: { type: Array, default: [] }
})

module.exports = User;