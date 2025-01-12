const languages = [
    { name: "None", iso: "null" },
    { name: "العربية", iso: "ar" },
    { name: "Български", iso: "bg" },
    { name: "বাংলা", iso: "bn" },
    { name: "Català", iso: "ca" },
    { name: "Čeština", iso: "cs" },
    { name: "Dansk", iso: "da" },
    { name: "Deutsch", iso: "de" },
    { name: "Ελληνικά", iso: "el" },
    { name: "English", iso: "en" },
    { name: "Español", iso: "es" },
    { name: "Eesti", iso: "et" },
    { name: "فارسی", iso: "fa" },
    { name: "Suomi", iso: "fi" },
    { name: "Français", iso: "fr" },
    { name: "עברית", iso: "he" },
    { name: "हिन्दी", iso: "hi" },
    { name: "Hrvatski", iso: "hr" },
    { name: "Magyar", iso: "hu" },
    { name: "Italiano", iso: "it" },
    { name: "日本語", iso: "ja" },
    { name: "ខ្មែរ", iso: "km" },
    { name: "ಕನ್ನಡ", iso: "kn" },
    { name: "한국어", iso: "ko" },
    { name: "Lietuvių", iso: "lt" },
    { name: "Latviešu", iso: "lv" },
    { name: "Монгол хэл", iso: "mn" },
    { name: "मराठी", iso: "mr" },
    { name: "Bahasa Melayu", iso: "ms" },
    { name: "ဗမာစာ", iso: "my" },
    { name: "नेपाली", iso: "ne" },
    { name: "Nederlands", iso: "nl" },
    { name: "Norsk", iso: "no" },
    { name: "ਪੰਜਾਬੀ", iso: "pa" },
    { name: "Polski", iso: "pl" },
    { name: "پښتو", iso: "ps" },
    { name: "Português", iso: "pt" },
    { name: "Română", iso: "ro" },
    { name: "Русский", iso: "ru" },
    { name: "සිංහල", iso: "si" },
    { name: "Slovenčina", iso: "sk" },
    { name: "Српски", iso: "sr" },
    { name: "Svenska", iso: "sv" },
    { name: "Kiswahili", iso: "sw" },
    { name: "தமிழ்", iso: "ta" },
    { name: "తెలుగు", iso: "te" },
    { name: "ภาษาไทย", iso: "th" },
    { name: "Türkçe", iso: "tr" },
    { name: "Українська", iso: "uk" },
    { name: "اردو", iso: "ur" },
    { name: "Tiếng Việt", iso: "vi" },
    { name: "Yorùbá", iso: "yo" },
    { name: "中文", iso: "zh" },
    { name: "isiZulu", iso: "zu" }
];

let genres = langFile.genres;
const sortedGenreNames = [];
for (let genre of genres) {
    sortedGenreNames.push(genre.name);
}

sortedGenreNames.sort();

let newGenreList = [];
for (let genre of sortedGenreNames) {
    newGenreList.push({ name: genre, id: genres.filter(a => a.name == genre)[0].id })
}

let copyAudioExists = false;
let changesHandlerExists = false;

genres = newGenreList;

// general expanding and collapsing function
for (let elem of document.querySelectorAll(".dropdown-top-part")) {
    const childNodes = Array.from(elem.childNodes);
    const input = childNodes.filter(a => a.localName == "input")[0];
    const arrow = childNodes.filter(a => a.localName == "img")[0];

    arrow.addEventListener("click", () => {
        if (["", "none"].includes(elem.nextElementSibling.style.display)) {
            elem.nextElementSibling.style.display = "flex";
            arrow.style.rotate = "180deg";
            elem.style.borderRadius = "8px 8px 0 0";
        } else {
            elem.nextElementSibling.style.display = "none";
            arrow.style.rotate = "0deg";
            elem.style.borderRadius = "8px";
        }
    })

    input.addEventListener("click", () => {
        if (["", "none"].includes(elem.nextElementSibling.style.display)) {
            elem.nextElementSibling.style.display = "flex";
            arrow.style.rotate = "180deg";
            elem.style.borderRadius = "8px 8px 0 0";
        } else {
            return;
        }
    })
}

// language setup
const langDropdownlist = document.querySelector(".language-dropdown .dropdown-list");
const langDropdownInput = document.querySelector(".language-dropdown .dropdown-top-part input");

function languageItemHandler(e) {
    langDropdownInput.nextElementSibling.style.rotate = "0deg";
    const lang = { iso: e.target.id.split("-")[1], name: e.target.innerHTML };
    langDropdownlist.style.display = "none";
    langDropdownInput.value = lang.name;
    langDropdownlist.innerHTML = `<div class="dropdown-item-wrapper" id="lang-${lang.iso}">${lang.name}</div>`
    if (copyAudioExists) copyAudio.language = lang.iso;
    if (langDropdownInput.classList.item(0)) langDropdownInput.classList.remove(langDropdownInput.classList.item(0));
    langDropdownInput.classList.add(`selected-${lang.iso}`);
    if (changesHandlerExists) changesHandler();
}

for (let lang of languages) {
    const langWrapper = document.createElement("div");
    langWrapper.classList.add("dropdown-item-wrapper");
    langWrapper.id = `lang-${lang.iso}`;
    langWrapper.innerHTML = lang.name;
    langDropdownlist.appendChild(langWrapper);

    langWrapper.addEventListener("click", languageItemHandler);
}

langDropdownInput.addEventListener("input", () => {
    if (["", "none"].includes(langDropdownlist.style.display)) {
        langDropdownlist.style.display = "flex";
        langDropdownInput.nextElementSibling.style.rotate = "180deg";
        langDropdownInput.parentElement.style.borderRadius = "8px 8px 0 0";
    }
    const query = langDropdownInput.value.trim().toLowerCase();
    langDropdownlist.innerHTML = "";
    langDropdownlist.style.overflowY = "hidden";
    const foundLang = languages.filter(a => a.iso.includes(query) || a.name.toLowerCase().includes(query));
    for (let lang of foundLang) {
        for (let c of langDropdownInput.classList) {
            langDropdownInput.classList.remove(c);
        }
        const langWrapper = document.createElement("div");
        langWrapper.classList.add("dropdown-item-wrapper");
        langWrapper.id = `lang-${lang.iso}`;
        langWrapper.innerHTML = lang.name;
        langDropdownlist.appendChild(langWrapper);

        langWrapper.addEventListener("click", languageItemHandler);
    }
    if (langDropdownlist.scrollHeight > langDropdownlist.clientHeight) langDropdownlist.style.overflowY = "scroll";
})

// genre setup
const genreDropdownlist = document.querySelector(".genre-dropdown .dropdown-list");
const genreDropdownInput = document.querySelector(".genre-dropdown .dropdown-top-part input");

function genreItemHandler(e) {
    genreDropdownInput.nextElementSibling.style.rotate = "0deg";
    const genre = { id: Number(e.target.id.split("-")[1]), name: e.target.innerHTML };
    genreDropdownlist.style.display = "none";
    genreDropdownInput.value = genre.name;
    genreDropdownlist.innerHTML = `<div class="dropdown-item-wrapper" id="genre-${genre.id}">${genre.name}</div>`
    if (copyAudioExists) copyAudio.genre = genre.id;
    if (genreDropdownInput.classList.item(0)) genreDropdownInput.classList.remove(genreDropdownInput.classList.item(0));
    genreDropdownInput.classList.add(`selected-${genre.id}`);
    if (changesHandlerExists) changesHandler();
}

for (let genre of genres) {
    const genreWrapper = document.createElement("div");
    genreWrapper.classList.add("dropdown-item-wrapper");
    genreWrapper.id = `genre-${genre.id}`;
    genreWrapper.innerHTML = genre.name;
    genreDropdownlist.appendChild(genreWrapper);

    genreWrapper.addEventListener("click", genreItemHandler);
}

genreDropdownInput.addEventListener("input", () => {
    if (["", "none"].includes(genreDropdownlist.style.display)) {
        genreDropdownlist.style.display = "flex";
        genreDropdownInput.nextElementSibling.style.rotate = "180deg";
        genreDropdownInput.parentElement.style.borderRadius = "8px 8px 0 0";
    }
    const query = genreDropdownInput.value.trim().toLowerCase();
    genreDropdownlist.innerHTML = "";
    genreDropdownlist.style.overflowY = "hidden";
    const foundGenres = genres.filter(a => a.id == query || a.name.toLowerCase().includes(query));
    for (let genre of foundGenres) {
        for (let c of genreDropdownInput.classList) {
            genreDropdownInput.classList.remove(c);
        }
        const genreWrapper = document.createElement("div");
        genreWrapper.classList.add("dropdown-item-wrapper");
        genreWrapper.id = `genre-${genre.id}`;
        genreWrapper.innerHTML = genre.name;
        genreDropdownlist.appendChild(genreWrapper);

        genreWrapper.addEventListener("click", genreItemHandler);
    }
    if (genreDropdownlist.scrollHeight > genreDropdownlist.clientHeight) genreDropdownlist.style.overflowY = "scroll";
})