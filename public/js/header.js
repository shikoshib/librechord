const language = !document.cookie ? "en" : document.cookie.split(";").filter(a => a.includes("lang="))[0].split("=")[1];

function getUserInfo() {
    return userInfo;
}

const languagesList = document.querySelector(".languages-list-wrapper");
const langButton = document.querySelector(".dropdown-lang");
document.querySelector(`#lang-${language}`).innerHTML = langFile.lang_name + `<small> (${langFile.current_lang})</small>`;
langButton.addEventListener("click", () => {
    if (["", "none"].includes(languagesList.style.display)) {
        languagesList.style.display = "flex";
        setTimeout(() => {
            languagesList.style.opacity = 1;
        }, 1);
    } else {
        languagesList.style.opacity = 0;
        setTimeout(() => {
            languagesList.style.display = "none";
        }, 150);
    }
})

for (let langElement of Array.from(languagesList.children)) {
    langElement.addEventListener("click", () => {
        document.cookie = `lang=${langElement.id.split("-")[1]}`;
        return location.reload();
    })
}

let userInfo;
async function global() {
    const userInfoRequest = await fetch("/api/me");
    if (userInfoRequest.status == 401) {
        userInfo = { username: null, likes: [] };
        document.querySelector(".user-wrapper").remove();
        document.querySelector("header").innerHTML += `<a href="/login" class="login-a">${langFile.login}</a>`
    } else {
        userInfo = await userInfoRequest.json();

        document.querySelector(".user-wrapper img").src = userInfo.hasAnAvatar ? `/avatars/${userInfo.username}.webp` : `/assets/no-avatar.svg`;
        document.querySelector(".dropdown-header img").src = userInfo.hasAnAvatar ? `/avatars/${userInfo.username}.webp` : `/assets/no-avatar.svg`;

        const displayName = document.querySelector(".display-name");
        const userName = document.querySelector(".real-name");
        displayName.innerHTML = userInfo.displayName;
        if (userInfo.displayName != "" && userInfo.displayName != userInfo.username) {
            userName.innerHTML = userInfo.username;
        } else {
            document.querySelector(".user-name").style.gap = 0;
        }

        const userWrapperImg = document.querySelector(".user-wrapper img");
        const userDropdownWrapper = document.querySelector(".user-dropdown-wrapper");
        userWrapperImg.addEventListener("click", () => {
            if (["", "none"].includes(userDropdownWrapper.style.display)) {
                userDropdownWrapper.style.display = "flex";
                setTimeout(() => {
                    userDropdownWrapper.style.opacity = 1;
                }, 1);
            } else {
                userDropdownWrapper.style.opacity = 0;
                languagesList.style.opacity = 0;
                setTimeout(() => {
                    userDropdownWrapper.style.display = "none";
                    languagesList.style.display = "none";
                }, 150);
            }
        })
    }

    const magnifyingGlass = document.querySelector("bg-img.magnifying-glass");
    const x = document.querySelector("bg-img.x");
    const searchField = document.querySelector("#search-field");

    searchField.addEventListener("input", () => {
        if (searchField.value.trim()) {
            x.style.opacity = "1";
            x.style.cursor = "pointer";
        } else {
            x.style.opacity = "0";
            x.style.cursor = "default";
        }
    })

    function searchHandler() {
        return location.pathname = `/search/${encodeURIComponent(searchField.value.trim())}`;
    }

    magnifyingGlass.addEventListener("click", searchHandler)

    x.addEventListener("click", () => {
        searchField.value = "";
        x.style.opacity = "0";
        x.style.cursor = "default";
    })

    document.addEventListener("keydown", (e) => {
        if (e.code == "Enter" && document.activeElement == searchField) {
            searchHandler();
        }
    })
}

global();