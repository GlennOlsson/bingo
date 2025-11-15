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

The first four character the tiles state with the first characters most significant bit representing the first tile, the 2nd most significant bit representing the 2nd tile, etc. The last two character the dataset ID and checksum with 3 bits if each value in each character. The 5th character has the 3 most significant bits of the dataset ID ORed with the 3 least significant bits of the checksum. The 6th and last character has the 3 least significant bits of the dataset ID ORed with the 3 most significant bits of the checksum.

Each value is XORed with it's corresponding value in the table below before encoded as a  character and set as the query parameter. To deocde the value, the same value is used to XOR it back.
| Character index | XORed with | As dec |
|-----------------|------------|--------|
| 0               | 101 010    | 42     |
| 1               | 010 010    | 18     |
| 2               | 110 011    | 51     |
| 3               | 011 110    | 30     |
| 4               | 101 101    | 45     |
| 5               | 011 011    | 27     |

The following table represent the characters in the state in the URL query. Bit 0 is the most significant bit and bit 6 the least significant bit. Remember that tile 12 does not need to be encoded as it's free.
| Character index | Bit 0            | Bit 1            | Bit 2            | Bit 3          | Bit 4          | Bit 5          |
|-----------------|------------------|------------------|------------------|----------------|----------------|----------------|
| 0               | tile 0           | tile 1           | tile 2           | tile 3         | tile 4         | tile 5         |
| 1               | tile 6           | tile 7           | tile 8           | tile 9         | tile 10        | tile 11        |
| 2               | tile 13          | tile 14          | tile 15          | tile 16        | tile 17        | tile 18        |
| 3               | tile 19          | tile 20          | tile 21          | tile 22        | tile 23        | tile 24        |
| 4               | dataset ID bit 0 | dataset ID bit 1 | dataset ID bit 2 | checksum bit 3 | checksum bit 4 | checksum bit 5 |
| 5               | dataset ID bit 4 | dataset ID bit 5 | dataset ID bit 6 | checksum bit 0 | checksum bit 1 | checksum bit 2 |

### Checksum
The checksum is a simple algorithm to ensure the query is correct. It is the sum of the XORed values, modulo 64.
