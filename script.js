const ELEM_ID_LANDING = "landing";
const ELEM_ID_GAME = "game";

const isOnLanding = () => {
    return window.location.hash === "";
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

window.onload = () => {
    setActivePage();
    if (!isOnLanding()) {
        loadGame();
    }
}