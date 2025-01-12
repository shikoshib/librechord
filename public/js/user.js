const userImg = document.querySelector("bg-img#user-img");
userImg.style.backgroundImage = target.hasAnAvatar ? `url("/avatars/${target.username}.webp")` : `url(/assets/no-avatar.svg)`;

const displayName = document.querySelector(".user-data .display-name");
const userName = document.querySelector(".user-data .real-name");
displayName.innerHTML = target.displayName;

let documentTitle;
if (target.displayName && target.displayName != target.username) {
    userName.innerHTML = target.username;
    documentTitle = langFile.users_page.replace("{name}", target.displayName);
} else {
    document.querySelector(".user-data .user-name").style.gap = 0;
    documentTitle = langFile.users_page.replace("{name}", target.username);
}

document.title = documentTitle;

const joinedDate = document.querySelector("#joined");
joinedDate.innerHTML = langFile.joined_date.replace("{timestamp}", `<span id="joined-date" title="${getFullDate(new Date(target.joinedDate))}">${tsToTimestamp(timeSince(new Date(target.joinedDate)))}</span>`);

const songList = document.querySelector(".songs-list");
const songsCount = document.querySelector("#songs-count");
songsCount.innerHTML = songsStr(songs.length);
for (let song of songs) {
    const artworkURL = song.hasAnArtwork ? `/assets/artworks/${song.id}.webp` : userImg.style.backgroundImage.split("url(\"")[1].split("\")")[0];
    songList.innerHTML +=
        `<div class="song">
            <div class="song-artwork">
                <a href="/${song.id}"><bg-img id="artwork" style="background-image: url(${artworkURL});"></bg-img></a>
            </div>
            <div class="song-metadata">
                <a href="/${song.id}"><span class="song-title">${song.title}</span></a>
                <a href=""><span class="song-artist">${target.displayName}</span></a>
            </div>
        </div>`;
}