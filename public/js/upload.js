const form = document.querySelector("form");
form.action = `/api/uploadAudio?default=${encodeURIComponent(getFullDate(new Date))}`;

const uploadAudioWrapper = document.querySelector(".upload-audio-wrapper");
const fileInput = document.querySelector("input[type=\"file\"]");

function clickListener() {
    fileInput.click();
}

uploadAudioWrapper.addEventListener("click", clickListener);

// drag n drop
function dragenter(e) {
    e.preventDefault();
    uploadAudioWrapper.style.background = "rgb(var(--box-color-hover))";
    uploadAudioWrapper.style.boxShadow = "0 0 16px rgba(var(--box-color-hover), .5)";
}

function dragleave(e) {
    e.preventDefault();
    uploadAudioWrapper.style.background = null;
    uploadAudioWrapper.style.boxShadow = null;
}

function dragover(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

function drop(e) {
    e.preventDefault();
    uploadAudioWrapper.style.background = null;
    uploadAudioWrapper.style.boxShadow = null;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;

        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
}

uploadAudioWrapper.addEventListener("dragenter", dragenter);
uploadAudioWrapper.addEventListener("dragleave", dragleave);
uploadAudioWrapper.addEventListener("dragover", dragover);
uploadAudioWrapper.addEventListener("drop", drop);

let audioId;

const songControlsWrapper = document.querySelector(".song-controls-wrapper");
const saveButton = document.querySelector(".save-button");

function parseStream(data) {
    const latestStream = data.split("\n\n")[data.split("\n\n").length - 2].split("~");
    return { type: Number(latestStream[0].split(": ")[1]), value: latestStream[1] };
}

fileInput.addEventListener("change", async () => {
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append("audio", fileInput.files[0]);

        const request = new XMLHttpRequest();
        request.open("POST", form.action);
        document.querySelector(".upload-audio-wrapper img").remove();
        request.upload.addEventListener("progress", (e) => {
            const percentage = (e.loaded / e.total) * 100;

            document.querySelector(".upload-audio-wrapper h1").innerHTML = langFile.uploading;
            document.querySelector(".upload-audio-wrapper p").innerHTML = percentage.toFixed(1) + "%";
        });

        request.addEventListener("progress", (e) => {
            const latestStream = parseStream(e.target.response);
            if (latestStream.type == 1) {
                audioId = latestStream.value;
                document.documentElement.style.setProperty("--box-shadow-hover", "initial");
                document.documentElement.style.setProperty("--box-shadow-active", "initial");
                document.documentElement.style.setProperty("--bg-hover", "var(--box-color)");
                document.documentElement.style.setProperty("--bg-active", "var(--box-color)");

                uploadAudioWrapper.removeEventListener("dragenter", dragenter);
                uploadAudioWrapper.removeEventListener("dragleave", dragleave);
                uploadAudioWrapper.removeEventListener("dragover", dragover);
                uploadAudioWrapper.removeEventListener("drop", drop);
                uploadAudioWrapper.removeEventListener("click", clickListener);
                uploadAudioWrapper.style.cursor = "default";
            } else if (latestStream.type == 2) {
                document.querySelector(".upload-audio-wrapper h1").innerHTML = langFile.converting;
                document.querySelector(".upload-audio-wrapper p").innerHTML = latestStream.value ? (Number(latestStream.value) * 100).toFixed(1) + "%" : "0%";
            } else {
                document.querySelector(".upload-audio-wrapper h1").innerHTML = langFile.finished;
                document.querySelector(".upload-audio-wrapper p").innerHTML = langFile.can_change_song_settings;

                songControlsWrapper.style.display = "flex";
                saveButton.style.display = "initial";
            }
        });

        request.send(formData);
    }
})

saveButton.addEventListener("click", async () => {
    const titleInput = document.querySelector("input#title");
    const languageInput = document.querySelector("#language-name");
    const genreInput = document.querySelector("#genre-name");

    const titleError = document.querySelector("#title-error");
    const genreError = document.querySelector("#genre-error");

    titleError.innerHTML = "";
    genreError.innerHTML = "";
    titleInput.classList.remove("errored-input");
    genreInput.parentElement.parentElement.classList.remove("errored-input");

    let isError = false;
    let lang;
    let genre;

    if (!titleInput.value.trim()) {
        isError = true;
        titleInput.classList.add("errored-input");
        titleError.innerHTML = langFile.please_type_title;
    }

    if (!genreInput.classList.item(0)) {
        genreInput.parentElement.parentElement.classList.add("errored-input");
        genreError.innerHTML = langFile.please_choose_genre;
    } else {
        genre = genreInput.classList.item(0).split("-")[1];
        if (!genre || !genres.filter(a => a.id == genre)[0]) {
            isError = true;
            genreError.innerHTML = langFile.please_choose_genre;
        }
    }

    if (!languageInput.classList.item(0)) {
        lang = "null";
    } else {
        lang = languageInput.classList.item(0).split("-")[1];
        if (!lang || !languages.filter(a => a.iso == lang)[0]) lang = "null";
    }

    if (isError) return;

    saveButton.disabled = true;

    const saveRequest = await fetch(`/api/saveAudio/${audioId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: titleInput.value.trim(),
            genre: genre,
            language: lang
        })
    });

    if (saveRequest.status == 200) return location.pathname = `/${audioId}`;
})