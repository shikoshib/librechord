const heading = langFile.edit_a_song.replace("{name}", audio.title);
document.title = heading + ` | Librechord`;
document.querySelector("h1").innerHTML = heading;

copyAudioExists = true;
changesHandlerExists = true;

const titleInput = document.querySelector("#title");
const genreInput = document.querySelector("#genre-name");
const languageInput = document.querySelector("#language-name");
const saveButton = document.querySelector(".save-button");
const fileInput = document.querySelector("input[type=\"file\"]");
const artworkControlsWrapper = document.querySelector(".artwork-controls-wrapper");

if (hasAnArtwork) artworkControlsWrapper.innerHTML += `<div class="remove-cover-art">${langFile.remove_cover_art}</div>`;

const removeCoverArt = document.querySelector(".remove-cover-art");

titleInput.value = audio.title;
if (audio.genre != -1) {
    genreInput.classList.add(`selected-${audio.genre}`);
    genreInput.value = genres.filter(a => a.id == audio.genre)[0].name;
}
languageInput.classList.add(`selected-${audio.language}`);
languageInput.value = languages.filter(a => a.iso == audio.language)[0].name;

function changesHandler() {
    if (JSON.stringify(audio) != JSON.stringify(copyAudio)) {
        saveButton.disabled = false;
    } else {
        saveButton.disabled = true;
    }
}

titleInput.addEventListener("input", () => {
    copyAudio.title = titleInput.value.trim();
    changesHandler();
})

async function saveAudio(genre, lang) {
    const saveRequest = await fetch(`/api/saveAudio/${audio.id}`, {
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

    if (saveRequest.status == 200) return location.pathname = `/${audio.id}`;
}

saveButton.addEventListener("click", async () => {
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

    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append("img", fileInput.files[0]);

        await fetch(`/api/uploadCoverArt?id=${audio.id}`, {
            method: "POST",
            body: formData
        });
    }
    await saveAudio(genre, lang);
    return;
})

const uploadCoverArtWrapper = document.querySelector(".upload-cover-art");
function clickListener() {
    fileInput.click();
}

// drag n drop
function dragenter(e) {
    e.preventDefault();
    uploadCoverArtWrapper.style.background = "var(--upload-cover-art-hover)";
}

function dragleave(e) {
    e.preventDefault();
    uploadCoverArtWrapper.style.background = null;
}

function dragover(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

function drop(e) {
    e.preventDefault();
    uploadCoverArtWrapper.style.background = null;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        fileInput.dispatchEvent("change", { bubbles: true })
    }
}

uploadCoverArtWrapper.addEventListener("dragenter", dragenter);
uploadCoverArtWrapper.addEventListener("dragleave", dragleave);
uploadCoverArtWrapper.addEventListener("dragover", dragover);
uploadCoverArtWrapper.addEventListener("drop", drop);

uploadCoverArtWrapper.addEventListener("click", clickListener);

fileInput.addEventListener("change", () => {
    document.querySelector(".upload-cover-art img").src = "/assets/check.svg";
    document.querySelector(".cover-art-caption").innerHTML = langFile.file_received;
    uploadCoverArtWrapper.innerHTML += `<div>${langFile.hit_save}</div>`;

    uploadCoverArtWrapper.removeEventListener("dragenter", dragenter);
    uploadCoverArtWrapper.removeEventListener("dragleave", dragleave);
    uploadCoverArtWrapper.removeEventListener("dragover", dragover);
    uploadCoverArtWrapper.removeEventListener("drop", drop);

    uploadCoverArtWrapper.removeEventListener("click", clickListener);
    uploadCoverArtWrapper.style.cursor = "default";
    document.documentElement.style.setProperty("--upload-cover-art-hover", "var(--dropdown-element-hover)");
    document.documentElement.style.setProperty("--upload-cover-art-active", "var(--dropdown-element-hover)");

    copyAudio.artwork = true;
    changesHandler();
})

removeCoverArt.addEventListener("click", async () => {
    if (confirm(langFile.delete_cover_warn)) {
        const response = await fetch("/api/removeCoverArt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                audioId: audio.id
            })
        });

        if (response.status >= 400) return alert(langFile.error_happened);
        removeCoverArt.remove();
        return alert(langFile.cover_deleted);
    }
})