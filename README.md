# Bingo
Bingo page, supporting multiple datasets, unique boards, and progress saving without using storage

<https://bingo.gl1.se>

## URL Query
The URL query is keeping the state of the game. There are 24 cells that are on or off (25th, middle, is always free). With 24 bits we can represent the state of each tile. We also represent the data set ID using 6 bits, and a checksum using 6 more bits. 

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

The first character encodes the dataset ID, the next 4 the tiles state, and the last character the checksum. Each character is XORed with it's corresponding value in the table below before set as the query parameter. To deocde the value, the same value is used to XOR it back.
| Character index | XORed with | As dec |
|-----------------|------------|--------|
| 0               | 101 010    | 42     |
| 1               | 010 010    | 18     |
| 2               | 110 011    | 51     |
| 3               | 011 110    | 30     |
| 4               | 101 101    | 45     |
| 5               | 011 011    | 27     |

### Checksum
The checksum is a simple algorithm to ensure the query is correct. It is the sum of the XORed values, modulo 64.

# State machine

1. Landing page
    - Select dataset and board ID. Encodes dataset id, all false tiles, and checksum as game state. Navigates to `/<boardId>?id=<gameState>`
2. Game page
    - Decodes game state. If fails, returns to landing.
    - If can decode, resumes game at state.
