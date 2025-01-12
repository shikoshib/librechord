const audioURL = `/audio/${audio.id}.mp4`;

async function getAverageColor(src) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const img = new Image();
        img.src = src;
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            let r = 0;
            let g = 0;
            let b = 0;
            let pixels = canvas.width * canvas.height;

            for (let i = 0; i < canvas.height; i++) {
                for (let j = 0; j < canvas.width; j++) {
                    const pixelData = ctx.getImageData(j, i, 1, 1);
                    r += pixelData.data[0];
                    g += pixelData.data[1];
                    b += pixelData.data[2];
                }
            }

            resolve({
                r: Math.round(r / pixels),
                g: Math.round(g / pixels),
                b: Math.round(b / pixels)
            });
        };
    });
}

async function main() {
    const audioElem = document.querySelector("audio");
    audioElem.src = audioURL;
    audioElem.crossOrigin = 'anonymous';

    const audioUploaderRequest = await fetch(`/api/user/${audio.username}`);
    const audioUploader = await audioUploaderRequest.json();

    const audioUploaderAvatar = audioUploader.hasAnAvatar ? `avatars/${audio.username}.webp` : `assets/no-avatar.svg`;

    document.title = `${audioUploader.displayName} - ${audio.title} | Librechord`;
    let coverArt;
    await fetch(`assets/artworks/${audio.id}.webp`).then((res) => {
        coverArt = res.status >= 400 ? audioUploaderAvatar : `assets/artworks/${audio.id}.webp`;
    })

    const songTitle = document.querySelector("song-title");
    const songArtist = document.querySelector("artist-name");
    const songArtistImg = document.querySelector("song-artist img");
    const songCoverArt = document.querySelector(".cover-art img");

    songTitle.innerHTML = audio.title;
    songArtist.innerHTML = `<a href="/user/${audio.username}">${audioUploader.displayName}</a>`;
    songArtistImg.src = audioUploaderAvatar;
    songCoverArt.src = coverArt;

    const timeElapsed = document.querySelector(".time-elapsed");
    const timeTotal = document.querySelector(".time-total");

    function calculateTime(s, moreThan10Min = false) {
        const seconds = s % 60;
        const minutes = (s - seconds) / 60;
        return `${moreThan10Min && minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${Math.trunc(seconds)}`;
    }

    timeElapsed.innerHTML = audio.duration > 600 ? "00:00" : "0:00";
    timeTotal.innerHTML = calculateTime(audio.duration, audio.duration > 600);

    let hasPlayed = false;

    const wavesurfer = WaveSurfer.create({
        container: "waveform",
        waveColor: "#aaa",
        progressColor: "white",
        sampleRate: 3000
    })

    wavesurfer.on('click', () => {
        audioElem.currentTime = wavesurfer.media.currentTime;
    })

    const listensCount = document.querySelector(".listens");
    listensCount.innerHTML = abbrCounter(audio.listens);
    listensCount.title = listensForm(audio.listens);

    audioElem.addEventListener("play", async () => {
        if (!hasPlayed) {
            hasPlayed = true;
            const request = await fetch("/api/incrementListen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    audioId: audio.id
                })
            });
            if (request.status < 400) {
                listensCount.innerHTML = abbrCounter(audio.listens + 1);
                listensCount.title = listensForm(audio.listens + 1);
                audio.listens++;
            } else {
                return;
            }
        }
    })

    audioElem.addEventListener("timeupdate", () => {
        wavesurfer.setTime(audioElem.currentTime);
        timeElapsed.innerHTML = calculateTime(audioElem.currentTime);
    })

    if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: audio.title,
            artist: audioUploader.displayName,
            artwork: [{
                src: coverArt,
                sizes: "512x512",
                type: "image/webp"
            }]
        });

        navigator.mediaSession.setActionHandler("play", () => {
            audioElem.play();
            playButtonIcon.id = "pause";
        })

        navigator.mediaSession.setActionHandler("pause", () => {
            audioElem.pause();
            playButtonIcon.id = "play";
        })

        navigator.mediaSession.setActionHandler("stop", () => {
            audioElem.currentTime = 0;
            playButtonIcon.id = "play";
            hasPlayed = false;
        })

        navigator.mediaSession.setActionHandler("seekbackward", () => {
            audioElem.currentTime = Math.max(audioElem.currentTime - 10, 0);
        })

        navigator.mediaSession.setActionHandler("seekforward", () => {
            audioElem.currentTime = Math.min(audioElem.currentTime + 10, audioElem.duration);
        })
    }

    wavesurfer.load(audioURL);

    function playPauseHandler() {
        if (audioElem.paused) {
            audioElem.play();
            playButtonIcon.id = "pause";
        } else {
            audioElem.pause();
            playButtonIcon.id = "play";
        }
    }

    const playButton = document.querySelector("play-button");
    const playButtonIcon = document.querySelector("play-button bg-img");
    playButton.addEventListener("click", playPauseHandler);

    document.addEventListener("keydown", (e) => {
        if (e.code == "Space" && !["search-field", "comment-textarea"].includes(document.activeElement.id)) playPauseHandler();
    })

    audioElem.addEventListener("ended", () => {
        playButtonIcon.id = "play";
        wavesurfer.setTime(0);
        hasPlayed = false;
        timeElapsed.innerHTML = calculateTime(0);
    });

    const songTimestamp = document.querySelector("song-timestamp");
    songTimestamp.innerHTML = tsToTimestamp(timeSince(new Date(audio.uploadDate)));
    songTimestamp.title = getFullDate(new Date(audio.uploadDate));

    if (userInfo.username == audio.username) {
        document.querySelector(".song-admin-controls").style.display = "flex";
        const edit = document.querySelector(".song-admin-controls a");
        edit.href = `/edit/${audio.id}`;
    }

    const trashButton = document.querySelector(".trash-btn");
    trashButton.addEventListener("click", async () => {
        if (confirm(langFile.delete_warn)) {
            const request = await fetch("/api/removeAudio", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    audioId: audio.id
                })
            });

            if (request.status >= 400) return alert(langFile.error_happened);
            return location.pathname = "/me";
        }
    })

    const volumeSlider = document.querySelector("#volume");
    volumeSlider.addEventListener("input", () => {
        audioElem.volume = volumeSlider.value / 100;
        localStorage.setItem("volume", volumeSlider.value);
    })

    if (localStorage.getItem("volume")) {
        audioElem.volume = localStorage.getItem("volume") / 100;
        volumeSlider.value = localStorage.getItem("volume");
    }

    const likeCount = document.querySelector(".like-count");
    const likeButton = document.querySelector(".like-button-wrapper");
    const likeIcon = document.querySelector(".like-button img");
    likeCount.innerHTML = audio.likes;
    if (userInfo.likes.includes(audio.id)) {
        likeIcon.src = "/assets/heart-fill.svg";
        likeIcon.classList.add("liked");
    }

    likeButton.addEventListener("click", async () => {
        if (likeIcon.classList.contains("liked")) {
            const request = await fetch("/api/likeAudio", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    audioId: audio.id,
                    action: "unlike"
                })
            });

            if (request.status < 400) {
                likeIcon.src = "/assets/heart.svg";
                likeIcon.classList.remove("liked");
                audio.likes--;
                likeCount.innerHTML = audio.likes;
            }
        } else {
            const request = await fetch("/api/likeAudio", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    audioId: audio.id,
                    action: "like"
                })
            });

            if (request.status < 400) {
                likeIcon.src = "/assets/heart-fill.svg";
                likeIcon.classList.add("liked");
                audio.likes++;
                likeCount.innerHTML = audio.likes;
            } else if (request.status == 401) {
                return location.pathname = "/login";
            }
        }
    })

    const comments = document.querySelector(".comments-wrapper");
    const commentsRequest = await fetch(`/api/getComments?audioId=${audio.id}`);
    let commentsArray = await commentsRequest.json();
    commentsArray = commentsArray.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    document.querySelector(".comments-header").innerHTML = commentsForm(commentsArray.length);

    async function removeCommentHandler(e) {
        if (confirm(langFile.delete_comment_warn)) {
            const commentId = e.target.id.split("-")[1];
            const request = await fetch("/api/removeComment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: commentId
                })
            });

            if (request.status < 400) {
                document.getElementById(`delete-${commentId}`).parentElement.parentElement.remove();
                commentsArray = commentsArray.filter(a => a._id != commentId);
                document.querySelector(".comments-header").innerHTML = commentsForm(commentsArray.length);
            }
        }
    }

    async function saveEditedComment(e) {
        const commentId = e.target.id.split("-")[1];
        const request = await fetch("/api/editComment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: commentId,
                content: document.getElementById(`comment-${e.target.id.split("-")[1]}-textarea`).value.trim()
            })
        });

        if (request.status < 400) {
            document.getElementById(`edit-${commentId}`).parentElement.parentElement.children[0].children[1].innerHTML = document.getElementById(`comment-${e.target.id.split("-")[1]}-textarea`).value.trim();
            e.target.removeEventListener("click", saveEditedComment);
            e.target.remove();
        }
    }

    async function editCommentHandler(e) {
        e.target.parentElement.parentElement.children[0].children[1].innerHTML = `<textarea class="comment-textarea" id="comment-${e.target.id.split("-")[1]}-textarea">${e.target.parentElement.parentElement.children[0].children[1].innerHTML}</textarea>`;
        e.target.parentElement.parentElement.children[0].children[1].innerHTML += `<div class="send-button" style="display: block; top: 27px; position: relative;"> <button id="send-${e.target.id.split("-")[1]}">${langFile.send}</button> </div>`;

        document.getElementById(`comment-${e.target.id.split("-")[1]}-textarea`).addEventListener("input", expandTextarea);
        document.getElementById(`send-${e.target.id.split("-")[1]}`).addEventListener("click", saveEditedComment);
    }

    if (commentsArray.length > 0) {
        for (let comment of commentsArray) {
            const commentControls = `
<div class="comment-controls">
    <img src="/assets/pencil.svg" title="((edit))" class="pencil-btn" id="edit-${comment._id}">
    <img src="/assets/trash.svg" title="((remove))" class="trash-btn" id="delete-${comment._id}">
</div>`;

            let avatarURL;

            await fetch(`/avatars/${comment.username}.webp`).then((res) => {
                avatarURL = res.status >= 400 ? "/assets/no-avatar.svg" : `/avatars/${comment.username}.webp`;
            });

            comments.innerHTML += `
<div class="comment">
    <div class="comment-info">
        <div class="comment-user">
            <a href="/user/${comment.username}" target="_blank"><img src="${avatarURL}" width="48"></a>
            <div class="comment-user-textinfo">
                <div class="comment-username"><a href="/user/${comment.username}" target="_blank">${comment.username}</a></div>
                <span>・</span>
                <div class="comment-timestamp">${tsToTimestamp(timeSince(new Date(comment.uploadDate)))}</div>
            </div>
        </div>
        <div class="comment-content">${comment.content.replaceAll("\n", "<br>")}</div>
    </div>
    ${comment.username == userInfo.username ? commentControls : ""}
</div>`
        }

        for (let editBtnElem of document.querySelectorAll(".pencil-btn")) {
            editBtnElem.addEventListener("click", editCommentHandler);
        }

        for (let deleteBtnElem of document.querySelectorAll(".trash-btn")) {
            deleteBtnElem.addEventListener("click", removeCommentHandler);
        }
    }

    function expandTextarea(e) {
        e.target.style.height = "";
        e.target.style.height = e.target.scrollHeight - 32 + "px";
        if (!e.target.value.trim()) {
            e.target.nextElementSibling.style.display = "none";
        } else {
            e.target.nextElementSibling.style.display = "flex";
            e.target.nextElementSibling.addEventListener("click", uploadComment);
        }
    }

    const commentTextarea = document.querySelector("#comment-textarea");
    commentTextarea.addEventListener("input", expandTextarea);

    async function uploadComment(e) {
        if (e.target.id) return;
        const request = await fetch("/api/uploadComment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                audioId: audio.id,
                content: commentTextarea.value.trim()
            })
        });

        const response = await request.json();

        if (request.status < 400) {
            e.target.parentElement.style.display = "none";
            e.target.parentElement.outerHTML += `
    <div class="comment">
        <div class="comment-info">
            <div class="comment-user">
                <a href="/user/${userInfo.username}" target="_blank"><img src="${userInfo.hasAnAvatar ? `/avatars/${userInfo.username}.webp` : "/assets/no-avatar.svg"}" width="48"></a>
                <div class="comment-user-textinfo">
                    <div class="comment-username"><a href="/user/${userInfo.username}" target="_blank">${userInfo.username}</a></div>
                    <span>・</span>
                    <div class="comment-timestamp">${tsToTimestamp(timeSince(new Date()))}</div>
                </div>
            </div>
            <div class="comment-content">${commentTextarea.value.trim().replaceAll("\n", "<br>")}</div>
        </div>
        <div class="comment-controls">
            <img src="/assets/pencil.svg" title="((edit))" class="pencil-btn" id="edit-${response.message}">
            <img src="/assets/trash.svg" title="((remove))" class="trash-btn" id="delete-${response.message}">
        </div>
    </div>`

            document.querySelector(`#edit-${response.message}`).addEventListener("click", editCommentHandler);
            document.querySelector(`#delete-${response.message}`).addEventListener("click", removeCommentHandler);

            commentsArray.push({ _id: response.message });
            document.querySelector(".comments-header").innerHTML = commentsForm(commentsArray.length);
            commentTextarea.value = "";
            e.target.parentElement.removeEventListener("click", uploadComment);
        }
    }

    const coverArtGradient = document.querySelector(".cover-art-gradient");
    const coverArtAverageColor = await getAverageColor(coverArt);
    coverArtGradient.style.background = `linear-gradient(rgb(${coverArtAverageColor.r},${coverArtAverageColor.g},${coverArtAverageColor.b}),rgba(${coverArtAverageColor.r},${coverArtAverageColor.g},${coverArtAverageColor.b},0))`
}

main();