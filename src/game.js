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

        console.log(`encoded value (${unencodedTiles}) for tiles ${tileStartIndex} to ${tileStartIndex + 5}: ${encodedTiles}`);
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
        console.log(`decoded value (${char}) for tiles ${(i - 1) * 6} to ${(i - 1) * 6 + 5}: ${decodedValue}`);
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
                tileElem.id = `tile-${tileIndex}`;
                tileElem.innerText = data[tileIndex < 12 ? tileIndex : tileIndex - 1];
            }

            rowElem.appendChild(tileElem);
        }

        gameContainerElem.appendChild(rowElem);
    }
}

const newGame = (boardId) => {
    let data = DATASETS[datasetID].data;
}

const loadGame = () => {
    const boardId = window.location.pathname.split("/").pop();

    let state = getGameState();
    if (!state) {
        console.log("No game ID found, returning home");
        window.location.href = "/";
    } else {
        try {
            const { datasetID, tiles } = decodeId(state);
            console.log(`Loaded game with dataset ID: ${datasetID}, tiles: ${tiles}`);
        } catch (error) {
            console.error("Failed to load game:", error);
            window.location.href = "/";
        }
    }
}