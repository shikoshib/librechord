const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

const router = require("express").Router();
const mongoose = require("mongoose");
const User = mongoose.model("user", require("../models/User"));
const Audio = mongoose.model("Audio", require("../models/Audio"));
const crypto = require("crypto");
const ERROR_CODES = require("../error_codes");
const fs = require("fs");
const path = require("path");
const { exec } = require("node:child_process");

function hashPassword(password, salt) {
    return crypto.createHash('sha512').update(password + salt).digest('hex');
}

const multer = require("multer"); const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "temp"))
    },
    filename: (req, file, cb) => {
        const randomName = Math.random().toString(36).substr(2, 10);
        req.fileName = randomName + path.extname(file.originalname);
        cb(null, req.fileName);
    }
});

const upload = multer({ storage: storage, dest: "../temp/", limits: 100 * 1024 * 1024 });

router.post("/login", async (req, res) => {
    const login = req.body.login;
    if (!login) return res.status(400).json({ error: true, errorCode: ERROR_CODES.NO_USERNAME });
    const password = req.body.password;
    if (!password) return res.status(400).json({ error: true, errorCode: ERROR_CODES.NO_PASSWORD });

    const user = await User.find({ $or: [{ email: login }, { username: login }] }); // ! this is an array !
    if (!user[0]) return res.status(400).json({ error: true, errorCode: ERROR_CODES.INCORRECT_PASSWORD });
    if (hashPassword(password, user[0].salt) != user[0].password) return res.status(400).json({ error: true, errorCode: ERROR_CODES.INCORRECT_PASSWORD });

    res.cookie("id", user[0]._id, {
        maxAge: 100 * 365 * 24 * 60 * 60 * 1000,
        httpOnly: true
    });

    return res.status(200).json({ error: false });
})

router.post("/register", async (req, res) => {
    const email = req.body.email;
    if (!email) return res.status(400).json({ error: true, errorCode: ERROR_CODES.NO_EMAIL });
    if (!emailRegex.test(email)) return res.status(400).json({ error: true, errorCode: ERROR_CODES.EMAIL_REGEX_NO_MATCH });

    const username = req.body.username;
    if (!username) return res.status(400).json({ error: true, errorCode: ERROR_CODES.NO_USERNAME });

    const password = req.body.password;
    if (!password) return res.status(400).json({ error: true, errorCode: ERROR_CODES.NO_PASSWORD });

    const salt = crypto.randomBytes(16).toString("hex");

    try {
        const user = new User({
            email: email,
            username: username,
            password: hashPassword(password, salt),
            salt: salt,
            joinedDate: new Date()
        });

        await user.save();

        res.cookie("id", user._id, {
            maxAge: 100 * 365 * 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        res.status(200).json({ error: false });
    } catch (e) {
        if (e.message.includes("index: username")) return res.status(400).json({ error: true, errorCode: ERROR_CODES.USERNAME_ALREADY_TAKEN });
        if (e.message.includes("index: email")) return res.status(400).json({ error: true, errorCode: ERROR_CODES.EMAIL_ALREADY_TAKEN });
        return res.status(500).json({ error: true, errorMessage: e.message });
    }
})

router.get("/user/:username", async (req, res) => {
    const username = req.params.username;
    if (!username) return res.status(400).json({ error: true });

    const user = await User.findOne({ username: username });
    if (!user) return res.status(404).json({ error: true });

    const newUserObject = {
        username: user.username,
        displayName: user.displayName != "" ? user.displayName : user.username,
        hasAnAvatar: fs.existsSync(__dirname + `/../public/avatars/${user.username}.webp`)
    }

    return res.json(newUserObject);
})

router.get("/me", async (req, res) => {
    if (!req.cookies.id) return res.status(401).json({ error: true });

    const user = await User.findOne({ _id: req.cookies.id });
    if (!user) return res.status(401).json({ error: true });

    const newUserObject = {
        username: user.username,
        email: user.email,
        displayName: user.displayName != "" ? user.displayName : user.username,
        hasAnAvatar: fs.existsSync(__dirname + `/../public/avatars/${user.username}.webp`),
        joinedDate: user.joinedDate,
        likes: user.likes
    }

    return res.json(newUserObject);
})

router.post("/deleteAccount", async (req, res) => {
    if (!req.cookies.id) return res.status(401).json({ error: true });

    const user = await User.findOne({ _id: req.cookies.id });
    if (!user) return res.status(401).json({ error: true });

    await User.deleteOne({ _id: req.cookies.id });

    // file cleanup
    const audios = await Audio.find({ username: user.username });
    try {
        for (let audio of audios) {
            await Audio.deleteOne({ id: audio.id });
            fs.unlinkSync(__dirname + `/../public/audio/${audio.id}.mp4`);
            fs.unlinkSync(__dirname + `/../public/assets/artworks/${audio.id}.webp`);
        }
        fs.unlinkSync(__dirname + `/../public/avatars/${user.username}.webp`);
    } catch (e) {
        console.log(e);
    }

    res.cookie("id", "");

    return res.json({ error: false });
})

router.post("/uploadAvatar", upload.single("img"), async (req, res) => {
    const userId = req.cookies.id;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: true });

    if (!req.file) return res.status(400).json({ error: true, errorCode: ERROR_CODES.NO_FILE_ATTACHED });

    function cleanup() {
        try {
            fs.unlinkSync(path.join(__dirname + "/..", "temp", req.fileName));
        } catch (e) {
            return;
        }
    }

    exec(`ffmpeg -i "${path.join(__dirname + "/..", "temp", req.fileName)}" -q:v 100 -vf "scale=720:720:force_original_aspect_ratio=increase,crop=720:720" "${path.join(__dirname + "/..", "public", "avatars", user.username + ".webp")}"`, async (error, stdout, stderr) => {
        if (error) {
            cleanup();
            return res.status(400).json({ error: true });
        }

        cleanup();
        return res.json({ error: false });
    });
});

router.post("/removeAvatar", async (req, res) => {
    let user;
    if (req.cookies.id) {
        user = await User.findOne({ _id: req.cookies.id });
        if (!user) return res.status(401).json({ error: true });
    }

    try {
        fs.unlinkSync(__dirname + `/../public/avatars/${user.username}.webp`);
    } catch (e) {
        return res.status(500).json({ error: true, errorMessage: e.message });
    }

    return res.json({ error: false });
})

router.post("/saveUser", async (req, res) => {
    let user;
    if (req.cookies.id) {
        user = await User.findOne({ _id: req.cookies.id });
        if (!user) return res.status(401).json({ error: true });
    }

    const username = req.body.username;
    const displayName = req.body.displayName;

    try {
        await User.updateOne({ _id: req.cookies.id }, { $set: { username: username, displayName: displayName } });
    } catch (e) {
        if (e.message.includes("duplicate")) return res.status(400).json({ error: true, errorCode: ERROR_CODES.USERNAME_ALREADY_TAKEN });
        return res.status(500).json({ error: true, errorMessage: e.message });
    }

    return res.json({ error: false });
})

router.get("/favorites", async (req, res) => {
    let user;
    if (req.cookies.id) {
        user = await User.findOne({ _id: req.cookies.id });
        if (!user) return res.status(401).json({ error: true });
    }

    const audioList = [];
    const searchedUsers = [];
    const searchedUsersObj = {};

    for (let audioId of user.likes) {
        const audio = await Audio.findOne({ id: audioId });

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

    return res.json(audioList);
})

module.exports = router;