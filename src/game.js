const ELEM_ID_GAME_CONTAINER = "game-container";

const CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-";

const ENCODING_VALUES = [
    42, 18, 51, 30, 45, 27
]

// Gets the encoded game state from the `state` query parameter. If not present, returns null.
const getGameState = () => {
    const params = new URLSearchParams(window.location.search);
    return params.has('state') ? params.get('state') : null;
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

// Handles a click on a game tile element. Toggles the "tile-marked" class
// and updates the game state in the URL.
const onTileClick = (event) => {
    let tileElem = event.currentTarget;
    tileElem.classList.toggle("tile-marked");

    const tileIndex = parseInt(tileElem.id.split("-")[1]);

    // Update game state in URL

    const encodedState = getGameState();

    let state = decodeState(encodedState);
    state.tiles[tileIndex] = !state.tiles[tileIndex];

    const newEncodedState = encodeState(state.datasetID, state.tiles);

    const url = new URL(window.location);
    url.searchParams.set('state', newEncodedState);
    window.history.replaceState({}, '', url);
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
}

// Loads the game state from the URL and initializes the game board.
const loadGame = () => {
    const boardId = window.location.pathname.split("/").pop();

    let state = getGameState();
    if (!state) {
        console.log("No game ID found, returning home");
        // TODO: uncomment in prod
        // window.location.href = "/";
    } else {
        try {
            const { datasetID, tiles } = decodeState(state);
            console.log(`Loaded game with dataset ID: ${datasetID}, tiles: ${tiles}`);
            setupGame(boardId, datasetID, tiles);
        } catch (error) {
            console.error("Failed to load game:", error);
            // TODO: uncomment in prod
            // window.location.href = "/";
        }
    }
}