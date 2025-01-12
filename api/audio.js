const router = require("express").Router();
const multer = require("multer");
const mongoose = require("mongoose");
const Audio = mongoose.model("Audio", require("../models/Audio"));
const User = mongoose.model("user", require("../models/User"));
const Comment = mongoose.model("Comment", require("../models/Comment"));
const ERROR_CODES = require("../error_codes");
const path = require("path");
const { spawn, exec } = require("node:child_process");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "temp"))
    },
    filename: (req, file, cb) => {
        const randomName = Math.random().toString(36).substr(2, 10);
        req.audioId = randomName;
        const fileExt = path.extname(file.originalname);
        const fullFileName = randomName + fileExt;
        req.fileName = fullFileName;
        cb(null, fullFileName);
    }
});

const upload = multer({ storage: storage, dest: "../temp/", limits: 100 * 1024 * 1024 });

router.post("/uploadAudio", upload.single("audio"), async (req, res) => {
    const userId = req.cookies.id;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: true });

    if (!req.file) return res.status(400).json({ error: true, errorCode: ERROR_CODES.NO_FILE_ATTACHED });

    function cleanup() {
        try {
            fs.unlinkSync(path.join(__dirname + "/..", "temp", req.fileName)) // remove the audio
            fs.unlinkSync(path.join(__dirname + "/..", "temp", req.audioId + ".json")) // remove the json
        } catch (e) {
            return;
        }
    }

    function timestampToSec(t) {
        const h = Number(t.split(":")[0]);
        const m = Number(t.split(":")[1]);
        const s = Number(t.split(":")[2]);

        return h * 3600 + m * 60 + s;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let duration;

    exec(`ffprobe -print_format json -show_format "${path.join(__dirname + "/..", "temp", req.fileName)}" > "${path.join(__dirname + "/..", "temp", req.audioId + ".json")}"`, async (error, stdout, stderr) => {
        if (error) {
            cleanup();
            return res.status(400).json({ error: true });
        }

        const json = JSON.parse(fs.readFileSync(path.join(__dirname + "/..", "temp", req.audioId + ".json")).toString());
        duration = Number(json.format.duration);

        res.write(`data: 1~${req.audioId}\n\n`);

        const ffmpeg = spawn("ffmpeg", [
            "-i",
            path.join(__dirname + "/..", "temp", req.fileName),
            "-b:a",
            Math.trunc(json.format.bit_rate / 1000) >= 256 ? "256k" : Math.trunc(json.format.bit_rate / 1000) + "k",
            "-c:a",
            "aac",
            "-vn",
            "-map_metadata",
            "-1",
            path.join(__dirname + "/..", "public", "audio", req.audioId + ".mp4")
        ]);

        let hasBegun = false;

        ffmpeg.stderr.on("data", (data) => {
            const output = data.toString();
            if (!output.split(" time=")[1]) {
                if (!hasBegun) {
                    res.write(`data: 2\n\n`);
                    hasBegun = true;
                }
                return;
            }
            const time = output.split(" time=")[1].split(" ")[0];

            res.write(`data: 2~${timestampToSec(time) / Number(json.format.duration)}\n\n`);

            if (output.includes('error')) {
                console.error('FFmpeg Error:', output);
            }
        });

        ffmpeg.on('close', (code) => {
            cleanup();
            if (code === 0) {
                res.write("data: 3\n\n");
                return res.end();
            } else {
                res.write(`data: 4~${code}`);
                return res.end();
            }
        });

        ffmpeg.on('error', (err) => {
            cleanup();
            console.error('Failed to start FFmpeg:', err);
        });

        try {
            const audio = new Audio({
                id: req.audioId,
                title: req.query.default,
                username: user.username,
                uploadDate: new Date(),
                genre: -1,
                language: "null",
                duration: duration
            });

            await audio.save();
        } catch (e) {
            console.log(e)
            return;
        }
    });

    return;
})

router.post("/saveAudio/:id", async (req, res) => {
    let user;
    if (req.cookies.id) {
        user = await User.findOne({ _id: req.cookies.id });
        if (!user) return res.status(401).json({ error: true });
    }

    const audio = await Audio.findOne({ id: req.params.id });
    if (!audio) return res.status(404).json({ error: true });
    if (user.username != audio.username) return res.status(403).json({ error: true });

    const title = req.body.title;
    const genre = req.body.genre;
    const language = req.body.language;

    try {
        await Audio.updateOne({ id: req.params.id }, { $set: { title: title, genre: Number(genre), language: language } });
    } catch (e) {
        return res.status(500).json({ error: true, errorMessage: e.message });
    }

    return res.json({ error: false });
})

router.post("/removeAudio", async (req, res) => {
    let user;
    if (req.cookies.id) {
        user = await User.findOne({ _id: req.cookies.id });
        if (!user) return res.status(401).json({ error: true });
    }

    const audioId = req.body.audioId;
    const audio = await Audio.findOne({ id: audioId });
    if (!audio) return res.status(404).json({ error: true });
    if (user.username != audio.username) return res.status(403).json({ error: true });

    try {
        await Audio.deleteOne({ id: audioId });
        fs.unlinkSync(path.join(__dirname + "/..", "public", "audio", audioId + ".mp4"));
    } catch (e) {
        return res.status(500).json({ error: true, errorMessage: e.message });
    }

    return res.json({ error: false });
})

router.post("/uploadCoverArt", upload.single("img"), async (req, res) => {
    const userId = req.cookies.id;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: true });

    if (!req.file) return res.status(400).json({ error: true, errorCode: ERROR_CODES.NO_FILE_ATTACHED });

    const audio = await Audio.findOne({ id: req.query.id });
    if (!audio) return res.status(404).json({ error: true });
    if (user.username != audio.username) return res.status(403).json({ error: true });

    function cleanup() {
        try {
            fs.unlinkSync(path.join(__dirname + "/..", "temp", req.fileName));
        } catch (e) {
            return;
        }
    }

    exec(`ffmpeg -i "${path.join(__dirname + "/..", "temp", req.fileName)}" -q:v 100 -vf "scale=720:720:force_original_aspect_ratio=increase,crop=720:720" "${path.join(__dirname + "/..", "public", "assets", "artworks", req.query.id + ".webp")}"`, async (error, stdout, stderr) => {
        if (error) {
            cleanup();
            return res.status(400).json({ error: true });
        }

        cleanup();
        return res.json({ error: false });
    });
});

router.post("/removeCoverArt", async (req, res) => {
    let user;
    if (req.cookies.id) {
        user = await User.findOne({ _id: req.cookies.id });
        if (!user) return res.status(401).json({ error: true });
    }

    const audioId = req.body.audioId;
    const audio = await Audio.findOne({ id: audioId });
    if (!audio) return res.status(404).json({ error: true });
    if (user.username != audio.username) return res.status(403).json({ error: true });

    try {
        fs.unlinkSync(path.join(__dirname + "/..", "public", "assets", "artworks", audioId + ".webp"));
    } catch (e) {
        return res.status(500).json({ error: true, errorMessage: e.message });
    }

    return res.json({ error: false });
})

router.post("/incrementListen", async (req, res) => {
    const audioId = req.body.audioId;
    const audio = await Audio.findOne({ id: audioId });
    if (!audio) return res.status(404).json({ error: true });

    try {
        await Audio.updateOne({ id: req.body.audioId }, { listens: audio.listens + 1 });
    } catch (e) {
        return res.status(500).json({ error: true, errorMessage: e.message });
    }

    return res.json({ error: false });
})

router.post("/likeAudio", async (req, res) => {
    if (!req.cookies.id) return res.status(401).json({ error: true });

    const user = await User.findOne({ _id: req.cookies.id });
    if (!user) return res.status(401).json({ error: true });

    const audioId = req.body.audioId;
    const action = req.body.action;
    const audio = await Audio.findOne({ id: audioId });
    if (!audio) return res.status(404).json({ error: true });

    if (!["unlike", "like"].includes(action)) return res.status(400).json({ error: true });

    if (action == "like") {
        try {
            const likes = user.likes;
            likes.push(audioId);
            await User.updateOne({ _id: req.cookies.id }, { likes: likes })
            await Audio.updateOne({ id: audioId }, { likes: audio.likes + 1 });
        } catch (e) {
            return res.status(500).json({ error: true, errorMessage: e.message });
        }
    } else {
        try {
            let likes = user.likes;
            likes = likes.filter(a => a != audioId);
            await User.updateOne({ _id: req.cookies.id }, { likes: likes })
            await Audio.updateOne({ id: audioId }, { likes: audio.likes - 1 });
        } catch (e) {
            return res.status(500).json({ error: true, errorMessage: e.message });
        }
    };

    return res.json({ error: false });
})

router.post("/uploadComment", async (req, res) => {
    if (!req.cookies.id) return res.status(401).json({ error: true });

    const user = await User.findOne({ _id: req.cookies.id });
    if (!user) return res.status(401).json({ error: true });

    const audioId = req.body.audioId;
    const content = req.body.content;

    const audio = await Audio.findOne({ id: audioId });
    if (!audio) return res.status(404).json({ error: true });

    if (!content) return res.status(400).json({ error: true });

    try {
        const comment = new Comment({
            audio: audioId,
            content: content,
            username: user.username,
            uploadDate: new Date()
        });

        await comment.save();
        return res.json({ error: false, message: comment._id });
    } catch (e) {
        return res.status(500).json({ error: true, errorMessage: e.message });
    }
});

router.get("/getComments", async (req, res) => {
    const audioId = req.query.audioId;
    const audio = await Audio.findOne({ id: audioId });
    if (!audio) return res.status(404).json({ error: true });

    const comments = await Comment.find({ audio: audioId });

    return res.json(comments);
})

router.post("/removeComment", async (req, res) => {
    if (!req.cookies.id) return res.status(401).json({ error: true });

    const user = await User.findOne({ _id: req.cookies.id });
    if (!user) return res.status(401).json({ error: true });

    const id = req.body.id;
    if (!id) return res.status(400).json({ error: true });

    const comment = await Comment.findById(id);
    if (comment.username != user.username) return res.status(403).json({ error: true });

    try {
        await Comment.findByIdAndDelete(id);
    } catch (e) {
        return res.status(500).json({ error: true, errorMessage: e.message });
    }

    return res.json({ error: false });
});

router.post("/editComment", async (req, res) => {
    if (!req.cookies.id) return res.status(401).json({ error: true });

    const user = await User.findOne({ _id: req.cookies.id });
    if (!user) return res.status(401).json({ error: true });

    const id = req.body.id;
    if (!id) return res.status(400).json({ error: true });

    const comment = await Comment.findById(id);
    if (comment.username != user.username) return res.status(403).json({ error: true });

    const content = req.body.content;
    if (!content) return res.status(400).json({ error: true });

    try {
        await Comment.findByIdAndUpdate(id, { content: content });
    } catch (e) {
        return res.status(500).json({ error: true, errorMessage: e.message });
    }

    return res.json({ error: false });
});

module.exports = router;