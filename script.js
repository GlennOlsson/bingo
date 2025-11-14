const ELEM_ID_LANDING = "landing";
const ELEM_ID_GAME = "game";

const isOnLanding = () => {
    const params = new URLSearchParams(window.location.search);
    return !params.has("id") || params.get("id") === null;
}

const setActivePage = () => {
    let landingElem = document.getElementById(ELEM_ID_LANDING);
    let gameElem = document.getElementById(ELEM_ID_GAME);

    if (isOnLanding()) {
        landingElem.classList.remove("hidden");
        gameElem.classList.add("hidden");
    } else {
        landingElem.classList.add("hidden");
        gameElem.classList.remove("hidden");
    }
}

const checkActivePage = () => {
    setActivePage();
    if (isOnLanding()) {
        createLanding();
    }
    else {
        loadGame();
    }
}

window.onload = () => {
    checkActivePage();
}