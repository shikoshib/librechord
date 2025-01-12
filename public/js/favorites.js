const searchResultsWrapper = document.querySelector(".search-results-wrapper");

async function main() {
    const request = await fetch("/api/favorites");
    const results = await request.json();
    if (!results.length) {
        searchResultsWrapper.innerHTML += langFile.no_fav_songs;
    } else {
        for (let song of results) {
            const artworkURL = song.hasAnArtwork ? `/assets/artworks/${song.id}.webp` : (song.hasAnAvatar ? `/avatars/${song.username}.webp` : "/assets/no-avatar.svg");
            searchResultsWrapper.innerHTML += `
            <div class="search-result">
                <div class="song-artwork">
                    <a href="/${song.id}"><bg-img id="artwork"
                            style="background-image: url(${artworkURL});"></bg-img></a>
                </div>
                <div class="song-metadata">
                    <a href="/${song.id}"><span class="song-title">${song.title}</span></a>
                    <a href="/user/${song.username}"><span class="song-artist">${song.displayName}</span></a>
                </div>
            </div>`
        }
    }
}

main();