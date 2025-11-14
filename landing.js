const ELEM_ID_DATASET_SELECT = "dataset-select";
const ELEM_ID_PLAYER_NAME_INPUT = "player-name";
const ELEM_ID_CREATE_GAME_BUTTON = "create-game-button";

const addDatasetSelections = () => {
    const datasetSelect = document.getElementById(ELEM_ID_DATASET_SELECT);

    // If dataset selections already added, do nothing.
    if (datasetSelect.hasChildNodes()) {
        return;
    }

    const datasets = getAllDatasets();

    Object.keys(datasets).forEach((key) => {
        const dataset = datasets[key];
        const optionElem = document.createElement("option");
        optionElem.value = key;
        optionElem.textContent = dataset.name;
        datasetSelect.appendChild(optionElem);
    });
}

const onCreateGameClicked = () => {
    const datasetSelect = document.getElementById(ELEM_ID_DATASET_SELECT);
    const selectedDatasetID = datasetSelect.value;

    const playerNameInput = document.getElementById(ELEM_ID_PLAYER_NAME_INPUT);
    const playerName = playerNameInput.value.trim();
    if (playerName === "") {
        alert("Please enter your name to create a game.");
        return;
    }
    
    let tileStates = new Array(24).fill(false); // All tiles unmarked
    let gameState = encodeState(selectedDatasetID, tileStates); // Initialize state

    // Redirect to game page with dataset ID and initial state in URL
    const url = new URL(window.location);
    url.searchParams.set("id", playerName);
    url.searchParams.set("state", gameState);

    window.history.replaceState({}, "", url);

    checkActivePage();
}

const createLanding = () => {
    document.getElementById(ELEM_ID_CREATE_GAME_BUTTON).addEventListener("click", onCreateGameClicked);

    addDatasetSelections();
}