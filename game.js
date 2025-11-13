const ELEM_ID_GAME_CONTAINER = "game-container";
const ELEM_ID_FIREWORKS_SCRIPT = "fireworks-script";

// Character set for encoding game state (64 characters for 6-bit values). The index
// of each character represents its encoded value.
const CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-";

// Values to XOR with dataset ID and tile groups during encoding/decoding.
const ENCODING_VALUES = [
    42, 18, 51, 30, 45, 27
]

// Gets the encoded game state from the `state` query parameter. If not present, returns null.
const getGameState = () => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    return params.has("state") ? params.get("state") : null;
}

// Converts an integer value (0-63) to a character from the CHARSET.
const asEncodedChar = (value) => CHARSET.charAt(value);

// Converts a boolean tile state to an integer (1 for true, 0 for false).
const asInt = (tileIsActive) => tileIsActive ? 1 : 0;

// Encode the dataset ID and tiles into a game state string. `tiles` is a 24-item array
// of booleans representing a tile being marked (true) or unmarked (false).
const encodeState = (datasetID, tiles) => {
    let encodedState = "";
    let checksum = 0;

    const encodedDatasetID = datasetID ^ ENCODING_VALUES[0];
    encodedState += asEncodedChar(encodedDatasetID);
    checksum += encodedDatasetID;

    for (let i = 1; i < 5; i++) {
        let tileStartIndex = (i - 1) * 6;
        let unencodedTiles = asInt(tiles[tileStartIndex]) << 5 |
            asInt(tiles[tileStartIndex + 1]) << 4 |
            asInt(tiles[tileStartIndex + 2]) << 3 |
            asInt(tiles[tileStartIndex + 3]) << 2 |
            asInt(tiles[tileStartIndex + 4]) << 1 |
            asInt(tiles[tileStartIndex + 5]);

        let encodedTiles = unencodedTiles ^ ENCODING_VALUES[i];

        encodedState += asEncodedChar(encodedTiles);
        checksum += encodedTiles;
    }

    const encodedChecksum = checksum % 64;
    encodedState += asEncodedChar(encodedChecksum);
    return encodedState;
}

// Decode a game state string into its dataset ID and tiles array. Game state is
// a 6 character string with the first character representing the dataset ID,
// the next 4 characters representing the tile states, and the last character
// being a checksum.
//
// Returns an object with `datasetID` and `tiles` properties.
const decodeState = (gameState) => {
    if (gameState.length !== 6) {
        throw new Error("Invalid game state length");
    }

    let checksum = 0;

    const encodedDatasetID = CHARSET.indexOf(gameState.charAt(0));
    const datasetID = encodedDatasetID ^ ENCODING_VALUES[0];
    checksum += encodedDatasetID;

    let tiles = [];

    for (let i = 1; i < 5; i++) {
        let char = gameState.charAt(i);
        let decodedValue = CHARSET.indexOf(char) ^ ENCODING_VALUES[i];
        checksum += CHARSET.indexOf(char);

        for (let bit = 5; bit >= 0; bit--)
            tiles.push((decodedValue & (1 << bit)) !== 0);
    }

    const encodedChecksum = CHARSET.indexOf(gameState.charAt(5));
    if ((checksum % 64) !== encodedChecksum) {
        throw new Error("Invalid checksum");
    }

    return { datasetID, tiles };
}

// Start fireworks if not already started.
const startFireworks = () => {
    // Load fireworks script if not already loaded. This ensures fireworks
    // are only fired once per bingo.
    if (document.getElementById(ELEM_ID_FIREWORKS_SCRIPT) == null) {
        const script = document.createElement("script");
        script.id = ELEM_ID_FIREWORKS_SCRIPT;
        script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js";
        script.onload = function () {
            for (let i = 0; i < 5; i++)
                confetti({
                    particleCount: 200,
                    spread: 70,
                    origin: { y: Math.random(), x: Math.random() }
                });
        };
        document.head.appendChild(script);
    }
}

// Check if all in one row, column, or diagonal are marked. Loads firework animation if bingo is achieved.
const checkBingo = (tiles) => {
    // Skipping the free tile for those rows, columns, and diagonals that include it.
    // Indicies larger than 12 are reduced by 1 to account for the free tile at index 12.
    const winningCombinations = [
        // Rows
        [0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9],
        [10, 11, 13 - 1, 14 - 1], // [10, 11, 12, 13]
        [15 - 1, 16 - 1, 17 - 1, 18 - 1, 19 - 1], // [14, 15, 16, 17, 18]
        [20 - 1, 21 - 1, 22 - 1, 23 - 1, 24 - 1], // [19, 20, 21, 22, 23]

        // Columns
        [0, 5, 10, 15 - 1, 20 - 1], // [0, 5, 10, 14, 19]
        [1, 6, 11, 16 - 1, 21 - 1], // [1, 6, 11, 15, 20]
        [2, 7, 17 - 1, 22 - 1], // [2, 7, 16, 21]
        [3, 8, 13 - 1, 18 - 1, 23 - 1], // [3, 8, 12, 17, 22]
        [4, 9, 14 - 1, 19 - 1, 24 - 1], // [4, 9, 13, 18, 23]

        // Diagonals
        [0, 6, 18 - 1, 24 - 1], // [0, 6, 17, 23]
        [4, 8, 16 - 1, 20 - 1] // [4, 8, 15, 19]
    ];

    for (let combination of winningCombinations) {
        if (combination.every(index => tiles[index])) {
            startFireworks();
            return true;
        }
    }

    // Remove fireworks script if no longer bingo. This ensures
    // fireworks can be restarted on subsequent bingos but only once.
    let fireworksElem = document.getElementById(ELEM_ID_FIREWORKS_SCRIPT);
    if (fireworksElem != null) {
        fireworksElem.remove();
    }

    return false;
}

// Handles a click on a game tile element. Toggles the "tile-marked" class
// and updates the game state in the URL.
const onTileClick = (event) => {
    let tileElem = event.currentTarget;
    tileElem.classList.toggle("tile-marked");

    const tileIndex = parseInt(tileElem.id.split("-")[1]);

    // Update game state
    const encodedState = getGameState();

    let state = decodeState(encodedState);
    state.tiles[tileIndex] = !state.tiles[tileIndex];

    checkBingo(state.tiles);

    const newEncodedState = encodeState(state.datasetID, state.tiles);

    // Update game state in URL
    const url = new URL(window.location);
    url.searchParams.set("state", newEncodedState);
    window.history.replaceState({}, "", url);
}

// Creates the game board HTML structure inside the game container element. The `data`
// is a 24-item array of strings representing the tile labels. `freeTileLabel` is the 
// label for the free tile in the center of the board.
const createBoard = (data, freeTileLabel) => {
    let gameContainerElem = document.getElementById(ELEM_ID_GAME_CONTAINER);

    for (let row = 0; row < 5; row++) {
        let rowElem = document.createElement("div");
        rowElem.classList.add("game-row");

        for (let col = 0; col < 5; col++) {
            let tileElem = document.createElement("div");
            tileElem.classList.add("game-tile");
            if (row === 2 && col === 2) {
                tileElem.id = "free-tile";
                tileElem.innerText = freeTileLabel;
            } else {
                let tileIndex = row * 5 + col;
                if (tileIndex > 12) tileIndex -= 1; // Adjust for free tile

                tileElem.id = `tile-${tileIndex}`;
                tileElem.innerText = data[tileIndex];
                tileElem.addEventListener("click", onTileClick);
            }

            rowElem.appendChild(tileElem);
        }

        gameContainerElem.appendChild(rowElem);
    }
}

// Shuffles an array using a seeded random number generator. The array
// is not modified; a new shuffled array is returned.
const shuffleArray = (array, seed) => {
    var rng = new Math.seedrandom(seed);
    let shuffledArray = array.slice();

    for (let i = 0; i < shuffledArray.length; i++) {
        let swapIndex = Math.abs(rng.int32() % shuffledArray.length);
        let temp = shuffledArray[i];
        shuffledArray[i] = shuffledArray[swapIndex];
        shuffledArray[swapIndex] = temp;
    }

    return shuffledArray;
}

// Sets up the game board with the given dataset ID and tile states.
// The `boardId` is used as seed for the shuffling of the dataset. 
const setupGame = (boardId, datasetID, tiles) => {
    let dataset = getDataset(datasetID);

    let shuffledData = shuffleArray(dataset.data, boardId);
    // Free title is either from dataset or the 25th shuffled item
    let freeTileLabel = dataset.freebie ? dataset.freebie : shuffledData[24];

    createBoard(shuffledData, freeTileLabel);

    // Apply tile states
    for (let i = 0; i < tiles.length; i++) {
        let tileElem = document.getElementById(`tile-${i}`);
        if (tiles[i]) {
            tileElem.classList.add("tile-marked");
        } else {
            tileElem.classList.remove("tile-marked");
        }
    }

    checkBingo(tiles);
}

// Navigates to the landing page by clearing the URL hash and updating the active page.
const goToLanding = () => {
    const url = new URL(window.location);
    url.search = "";
    window.history.replaceState({}, "", url);
    setActivePage();
}

// Loads the game state from the URL and initializes the game board.
const loadGame = () => {
    const boardId = new URLSearchParams(window.location.search).get("id");
    console.log("Loading game with ID:", boardId);

    let state = getGameState();
    if (!state) {
        console.log("No game state found, returning home");
        goToLanding();
    } else {
        try {
            const { datasetID, tiles } = decodeState(state);
            console.log(`Loaded game with dataset ID: ${datasetID}, tiles: ${tiles}`);
            setupGame(boardId, datasetID, tiles);
        } catch (error) {
            console.error("Failed to load game:", error);
            goToLanding();
        }
    }
}