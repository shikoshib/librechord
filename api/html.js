const router = require("express").Router();
const mongoose = require("mongoose");
const User = mongoose.model("user", require("../models/User"));
const Audio = mongoose.model("Audio", require("../models/Audio"));
const fs = require("fs");
const path = require("path");

router.use((req, res, next) => {
    let recommendedLanguage;

    if (!req.cookies.lang) {
        const acceptLanguages = req.headers["accept-language"];
        const languages = acceptLanguages.split(",").filter(a => !a.includes("-") && a.includes("q="));
        const AL = [];
        for (let lang of languages) {
            AL.push({ code: lang.split(";")[0], value: Number(lang.split("=")[1]) })
        };

        for (let lang of AL) {
            if (fs.existsSync(__dirname + `/../lang/${lang.code}.json`)) {
                recommendedLanguage = lang.code;
                break;
            }
        }
        if (!recommendedLanguage) recommendedLanguage = "en";

        res.cookie("lang", recommendedLanguage, {
            maxAge: 100 * 365 * 24 * 60 * 60 * 1000
        });
    } else {
        if (!fs.existsSync(__dirname + `/../lang/${req.cookies.lang}.json`)) {
            res.cookie("lang", "en", {
                maxAge: 100 * 365 * 24 * 60 * 60 * 1000
            });
        }
    }

    const lang = fs.existsSync(__dirname + `/../lang/${req.cookies.lang}.json`) ? req.cookies.lang : recommendedLanguage;
    req.lang = lang;
    next();
})

function sendErrorPage(req, res, status = 404) {
    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());
    let html = fs.readFileSync(path.join(__dirname + "/..", "html", status + ".html")).toString();
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");
    return res.status(status).send(html);
}

router.get("/upload", async (req, res) => {
    if (req.cookies.id) {
        const user = await User.findOne({ _id: req.cookies.id });
        if (!user) return res.redirect(`/login`);
    }

    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/upload-audio.html").toString();
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");

    return res.send(html);
})

router.get("/user/:username", async (req, res) => {
    const username = req.params.username;

    const user = await User.findOne({ username: username });
    if (!user) return sendErrorPage(req, res, 404);

    const songs = await Audio.find({ username: user.username });
    let list = [];
    for (let song of songs) {
        list.push({
            id: song.id,
            title: song.title,
            uploadDate: song.uploadDate,
            hasAnArtwork: fs.existsSync(__dirname + `/../public/assets/artworks/${song.id}.webp`)
        })
    }
    list = list.sort((a, b) => b.uploadDate - a.uploadDate);

    const target = {
        username: user.username,
        displayName: user.displayName != "" ? user.displayName : user.username,
        hasAnAvatar: fs.existsSync(__dirname + `/../public/avatars/${user.username}.webp`),
        joinedDate: user.joinedDate
    }

    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/user.html").toString();
    html = html.replace("(songs-list)", JSON.stringify(list).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");
    html = html.replace("(target)", JSON.stringify(target).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");

    return res.send(html);
})

router.get("/me", async (req, res) => {
    if (req.cookies.id) {
        const user = await User.findOne({ _id: req.cookies.id });
        if (user) return res.redirect(`/user/${user.username}`);
    }

    return res.redirect("/login");
})

router.get("/login", async (req, res) => {
    if (req.cookies.id) {
        const user = await User.findOne({ _id: req.cookies.id });
        if (user) return res.redirect("/");
    }

    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/log-in.html").toString();
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");

    return res.send(html);
})

router.get("/signup", async (req, res) => {
    if (req.cookies.id) {
        const user = await User.findOne({ _id: req.cookies.id });
        if (user) return res.redirect("/");
    }

    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/sign-up.html").toString();
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");

    return res.send(html);
})

router.get("/logout", (req, res) => {
    res.cookie("id", "");
    return res.redirect("/");
})

router.get("/search", (req, res) => {
    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/search.html").toString();
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");

    return res.send(html);
})

router.get("/search/:id", async (req, res) => {
    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/search-results.html").toString();
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");

    return res.send(html);
})

router.get("/edit/:id", async (req, res) => {
    if (!req.cookies.id) return sendErrorPage(req, res, 403);

    const user = await User.findOne({ _id: req.cookies.id });
    if (!user) return sendErrorPage(req, res, 403);

    const audio = await Audio.findOne({ id: req.params.id });
    if (!audio) return sendErrorPage(req, res, 404);

    if (user.username != audio.username) return sendErrorPage(req, res, 403);

    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/edit-audio.html").toString();
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(audio)", JSON.stringify(audio).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");
    html = html.replace("(hasAnArtwork)", fs.existsSync(__dirname + `/../public/assets/artworks/${audio.id}.webp`));

    return res.send(html);
})

router.get("/settings", async (req, res) => {
    if (!req.cookies.id) return res.redirect("/login");

    const user = await User.findOne({ _id: req.cookies.id });
    if (!user) return res.redirect("/login");

    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/settings.html").toString();
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");
    html = html.replace("(hasAnAvatar)", fs.existsSync(__dirname + `/../public/avatars/${user.username}.webp`));

    return res.send(html);
})

router.get("/", async (req, res) => {
    if (req.cookies.id) {
        const user = await User.findOne({ _id: req.cookies.id });
        if (user) return res.redirect("/search");
    }

    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/main.html").toString();
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");

    return res.send(html);
});

router.get("/favorites", async (req, res) => {
    if (!req.cookies.id) return res.redirect("/login");

    const user = await User.findOne({ _id: req.cookies.id });
    if (!user) return res.redirect("/login");

    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/favorites.html").toString();
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");

    return res.send(html);
});

// this should always be the last defined route
router.get("/:id", async (req, res) => {
    const id = req.params.id;

    const audio = await Audio.findOne({ id: id });
    if (!audio) return sendErrorPage(req, res, 404);

    const langFile = JSON.parse(fs.readFileSync(__dirname + `/../lang/${req.lang}.json`).toString());

    let html = fs.readFileSync(__dirname + "/../html/audio.html").toString();
    html = html.replace("(audio)", JSON.stringify(audio).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");
    html = html.replace("((header))", fs.readFileSync(__dirname + "/../html/header-template.html").toString());
    for (let key of Object.keys(langFile)) {
        html = html.replaceAll(`((${key}))`, langFile[key]);
    }
    html = html.replace("(langFile)", JSON.stringify(langFile).replaceAll("\'", "\\'")).replaceAll("\\\"", "\\\\\"");

    return res.send(html);
})
// don't add any more routes from here

module.exports = router;