const usernameRegex = /[^\w.-]+/g;
const deleteAccount = document.querySelector("#delete-account");
deleteAccount.addEventListener("click", async () => {
    if (confirm(langFile.delete_acc_warn)) {
        const request = await fetch("/api/deleteAccount", {
            method: "POST"
        });

        if (request.status >= 400) return alert(langFile.error_happened);
        return location.pathname = "/";
    }
});

const avatarControls = document.querySelector(".artwork-controls-wrapper");
const uploadAvatar = document.querySelector(".upload-cover-art");
if (hasAnAvatar) avatarControls.innerHTML += `<div class="remove-cover-art">${langFile.remove_avatar}</div>`;
const removeAvatar = document.querySelector(".remove-cover-art");
const username = document.querySelector("#username");
const displayName = document.querySelector("#display-name");
const fileInput = document.querySelector("input[type=\"file\"]");
const saveButton = document.querySelector(".save-button");
const usernameError = document.querySelector("#username-error");

let copyUser;

setTimeout(() => {
    if (userInfo.displayName != userInfo.username) {
        displayName.value = userInfo.displayName;
    } else {
        userInfo.displayName = "";
    }
    username.value = userInfo.username;
    copyUser = JSON.parse(JSON.stringify(userInfo));
}, 30);

username.addEventListener("input", () => {
    copyUser.username = username.value.trim();
    changesHandler();
})

displayName.addEventListener("input", () => {
    copyUser.displayName = displayName.value.trim();
    changesHandler();
})

function clickListener() {
    fileInput.click();
}

function changesHandler() {
    if (JSON.stringify(userInfo) != JSON.stringify(copyUser)) {
        saveButton.disabled = false;
    } else {
        saveButton.disabled = true;
    }
}

// drag n drop
function dragenter(e) {
    e.preventDefault();
    uploadAvatar.style.background = "var(--upload-cover-art-hover)";
}

function dragleave(e) {
    e.preventDefault();
    uploadAvatar.style.background = null;
}

function dragover(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

function drop(e) {
    e.preventDefault();
    uploadAvatar.style.background = null;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        fileInput.dispatchEvent("change", { bubbles: true })
    }
}

async function saveUser() {
    const saveRequest = await fetch(`/api/saveUser`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username.value.trim(),
            displayName: displayName.value.trim() == username.value.trim() ? "" : displayName.value.trim()
        })
    });

    const response = await saveRequest.json();
    if (response.errorCode == 7) {
        usernameError.innerHTML = langFile.username_taken;
        username.classList.add("errored-input");
        return;
    }
    if (saveRequest.status == 200) return location.pathname = `/me`;
}

saveButton.addEventListener("click", async () => {
    usernameError.innerHTML = "";
    username.classList.remove("errored-input");

    if (!username.value.trim()) {
        username.classList.add("errored-input");
        usernameError.innerHTML = langFile.please_type_username;
        return;
    }

    if(usernameRegex.test(username.value.trim())){
        username.classList.add("errored-input");
        usernameError.innerHTML = langFile.username_chlimit;
        return;
    }

    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append("img", fileInput.files[0]);

        await fetch("/api/uploadAvatar", {
            method: "POST",
            body: formData
        });
    }

    await saveUser();
    return;
})

uploadAvatar.addEventListener("dragenter", dragenter);
uploadAvatar.addEventListener("dragleave", dragleave);
uploadAvatar.addEventListener("dragover", dragover);
uploadAvatar.addEventListener("drop", drop);

uploadAvatar.addEventListener("click", clickListener);

fileInput.addEventListener("change", () => {
    document.querySelector(".upload-cover-art img").src = "/assets/check.svg";
    document.querySelector(".cover-art-caption").innerHTML = langFile.file_received;
    uploadAvatar.innerHTML += `<div>${langFile.hit_save}</div>`;

    uploadAvatar.removeEventListener("dragenter", dragenter);
    uploadAvatar.removeEventListener("dragleave", dragleave);
    uploadAvatar.removeEventListener("dragover", dragover);
    uploadAvatar.removeEventListener("drop", drop);

    uploadAvatar.removeEventListener("click", clickListener);
    uploadAvatar.style.cursor = "default";
    document.documentElement.style.setProperty("--upload-cover-art-hover", "var(--dropdown-element-hover)");
    document.documentElement.style.setProperty("--upload-cover-art-active", "var(--dropdown-element-hover)");

    copyUser = JSON.parse(JSON.stringify(userInfo));
    copyUser.avatar = true;
    changesHandler();
})

removeAvatar.addEventListener("click", async () => {
    if (confirm(langFile.delete_avatar_warn)) {
        const response = await fetch("/api/removeAvatar", {
            method: "POST"
        });

        if (response.status >= 400) return alert(langFile.error_happened);
        removeAvatar.remove();
        return alert(langFile.avatar_deleted);
    }
})