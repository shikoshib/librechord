const searchQuery = decodeURIComponent(location.pathname.split("/")[location.pathname.split("/").length - 1]);
const title = langFile.search_results.replace("{query}", searchQuery);
document.title = title;

const searchResultsWrapper = document.querySelector(".search-results-wrapper");
const heading = document.querySelector(".search-results-wrapper h1");

async function main() {
    const request = await fetch(`/api/search?q=${decodeURIComponent(searchQuery)}`);
    const results = await request.json();
    if (!results.length) {
        heading.innerHTML = langFile.couldnt_find;
        searchResultsWrapper.children[1].remove();
        searchResultsWrapper.style.textAlign = "center";
        searchResultsWrapper.style.gap = "16px";
        searchResultsWrapper.innerHTML += `<p>${langFile.no_search_results.replace("{query}", searchQuery)}</p>`;
    } else {
        heading.innerHTML = title;
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