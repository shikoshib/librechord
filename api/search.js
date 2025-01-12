const router = require("express").Router();
const mongoose = require("mongoose");
const Audio = mongoose.model("Audio", require("../models/Audio"));
const User = mongoose.model("user", require("../models/User"));
const fs = require("fs");

router.get("/search", async (req, res) => {
    const searchQuery = req.query.q;

    const audios = await Audio.find();
    const audioList = [];

    const searchedUsers = [];
    const searchedUsersObj = {};
    for (let audio of audios) {
        if (audio.id == searchQuery) {
            if (!searchedUsers.includes(audio.username)) {
                const user = await User.findOne({ username: audio.username });
                searchedUsers.push(user.username);
                searchedUsersObj[user.username] = user;
            }

            audioList.push({
                id: audio.id,
                title: audio.title,
                username: audio.username,
                displayName: searchedUsersObj[audio.username].displayName != "" ? searchedUsersObj[audio.username].displayName : audio.username,
                hasAnArtwork: fs.existsSync(__dirname + `/../public/assets/artworks/${audio.id}.webp`),
                hasAnAvatar: fs.existsSync(__dirname + `/../public/avatars/${audio.username}.webp`)
            });

            return res.json(audioList);
        } else if (audio.title.toLowerCase().includes(searchQuery.toLowerCase()) || audio.username.toLowerCase().includes(searchQuery.toLowerCase())) {
            if (!searchedUsers.includes(audio.username)) {
                const user = await User.findOne({ username: audio.username });
                searchedUsers.push(user.username);
                searchedUsersObj[user.username] = user;
            }

            audioList.push({
                id: audio.id,
                title: audio.title,
                username: audio.username,
                displayName: searchedUsersObj[audio.username].displayName != "" ? searchedUsersObj[audio.username].displayName : audio.username,
                hasAnArtwork: fs.existsSync(__dirname + `/../public/assets/artworks/${audio.id}.webp`),
                hasAnAvatar: fs.existsSync(__dirname + `/../public/avatars/${audio.username}.webp`)
            });
        }
    }

    return res.json(audioList);
})

module.exports = router;