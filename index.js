const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

const mongoose = require("mongoose");
mongoose.connect('mongodb://127.0.0.1:27017/librechord').then(() => console.log('db connected'));

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

const userRouter = require("./api/user.js");
const audioRouter = require("./api/audio.js");
const searchRouter = require("./api/search.js");
const htmlRouter = require("./api/html.js");

app.use("/api", userRouter);
app.use("/api", audioRouter);
app.use("/api", searchRouter);

app.use("/", htmlRouter);

app.listen(7777);