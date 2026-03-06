# Bingo
Bingo page, supporting multiple datasets, unique boards, and progress saving without using storage.

<https://bingo.gl1.se> 

[![Favicon](./favicon.svg)](https://bingo.gl1.se)

## URL Query
The URL query is keeping the state of the game. There are 24 cells that are selected or unselected (25th, middle, is always free). With 24 bits we can represent the state of each tile, where `1` means it is checked and `0` means it's unchecked. We also represent the data set ID using 6 bits, and a checksum using 6 more bits. This allows us to have 64 different bingo data sets.

By using a charset of 64 characters, we can represent 6 bits with just one character. We use `a-z`, `A-Z`, `0-9`, and `+-` as the charset, with:
- `a` representing `000 000` (0)
- `b` representing `000 001` (1)
- `A` representing `011 010` (26)
- `B` representing `011 011` (27)
- `0` representing `110 100` (52)
- `1` representing `110 101` (53)
- `+` representing `111 110` (62)
- `-` representing `111 111` (63)
- etc.

Using 4 characters for the tile encoding, 1 character for the dataset ID encoding, and 1 character for the charset encoding, we can encode the game state in 6 characters. We store this ID as the `state` URL query.

The first four character in the `state` query represents the tiles' state with the first character's most significant bit representing the first tile, the second most significant bit of the first character representing the 2nd tile, etc. The last two characters represents the dataset ID and checksum with 3 bits of each value in each character. The 5th character has the 3 most significant bits of the dataset ID ORed with the 3 least significant bits of the checksum. The 6th and last character has the 3 least significant bits of the dataset ID ORed with the 3 most significant bits of the checksum. The last two characters are encoded like this to ensure they are updated when tiles are checked/unchecked (as checksum changes), i.e. each time the game state changes.

Each value is XORed with it's corresponding value in the table below before encoded as a  character and set as the query parameter. To decode the value, the same value is used to XOR it back.
| Character index | XORed with | As dec |
|-----------------|------------|--------|
| 0               | 101 010    | 42     |
| 1               | 010 010    | 18     |
| 2               | 110 011    | 51     |
| 3               | 011 110    | 30     |
| 4               | 101 101    | 45     |
| 5               | 011 011    | 27     |

The following table describes the characters in the `state` URL query before they are XORed with the table above. Bit 0 is the most significant bit and bit 6 the least significant bit. Remember that tile 12 does not need to be encoded as it's free.
| Character index | Bit 0            | Bit 1            | Bit 2            | Bit 3          | Bit 4          | Bit 5          |
|-----------------|------------------|------------------|------------------|----------------|----------------|----------------|
| 0               | tile 0           | tile 1           | tile 2           | tile 3         | tile 4         | tile 5         |
| 1               | tile 6           | tile 7           | tile 8           | tile 9         | tile 10        | tile 11        |
| 2               | tile 13          | tile 14          | tile 15          | tile 16        | tile 17        | tile 18        |
| 3               | tile 19          | tile 20          | tile 21          | tile 22        | tile 23        | tile 24        |
| 4               | dataset ID bit 0 | dataset ID bit 1 | dataset ID bit 2 | checksum bit 3 | checksum bit 4 | checksum bit 5 |
| 5               | dataset ID bit 4 | dataset ID bit 5 | dataset ID bit 6 | checksum bit 0 | checksum bit 1 | checksum bit 2 |

Using this table, you can manually decode a game state. For instance, take a game with state `bsZEOp`. The first character `b` == `1` in our base64 charset. `1 XOR 0b101010` (from the table above) == `0b101_011`, meaning the 1st, 3rd, 5th and 6th tile is marked. Decoding the other characters is left as an exercise for the reader.

### Game ID
The `id` URL query parameter is the name of the player. This is used as a seed for the random number generator randomizing the board. This ensures that the board will be in the same order each time the dataset is shuffled, as long as the game ID stays the same. Changing the game ID of an active game (with a game state) will only reshuffle the board, but the checked tiles will stay the same.

### Checksum
The checksum is a simple algorithm to ensure the query is correct after decoding. It is the sum of the XORed values, modulo 64.

### Why so complicated?
Because it's fun!