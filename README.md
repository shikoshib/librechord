# Librechord

Librechord is an open-source website for sharing and publishing music. Inspired by [Spotify](https://open.spotify.com) and [SoundCloud](https://soundcloud.com).

## How to run (Windows)
1. Install [Node.js](https://nodejs.org/en/download), [ffmpeg](https://www.ffmpeg.org/download.html) and [MongoDB Compass](https://www.mongodb.com/try/download/compass) if you haven't already.
2. In MongoDB, create a database, name it `librechord` and create three collections in it: `audios`, `comments` and `users`.
3. Download this repository and unpack it in any folder.
4. Open this folder in the terminal/command prompt.
5. Run `npm i` to install the necessary packages.
6. Run `npm start`. The website should be running at http://localhost:7777/

## Main features
* Account system
* Uploading songs
* Searching through songs
* Multilingual support ([full language list here](https://github.com/shikoshib/librechord/tree/main/lang))
