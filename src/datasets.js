// Each dataset has a `name`, `description`, and an `data` array of data items. The dataset
// needs at least 25 (or 24 and a `freebie`) items to fill a Bingo card. The `freebie` attribute is optional and
// indicates which item should be used as the free space in the center of the card. It should
// NOT be included in the `data` array.
const DATASETS = {
    0: {
        name: "Bingo",
        description: "Standard Bingo numbers",
        data: [
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
            "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
            "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
            "31", "32", "33", "34", "35", "36", "37", "38", "39", "40",
            "41", "42", "43", "44", "45", "46", "47", "48", "49", "50"
        ]
    },
    1: {
        name: "US States",
        description: "US States dataset",
        freebie: "California",
        data: [
            "Alabama",
            "Alaska",
            "Arizona",
            "Arkansas",
            "Colorado",
            "Connecticut",
            "Delaware",
            "Florida",
            "Georgia",
            "Hawaii",
            "Idaho",
            "Illinois",
            "Indiana",
            "Iowa",
            "Kansas",
            "Kentucky",
            "Louisiana",
            "Maine",
            "Maryland",
            "Massachusetts",
            "Michigan",
            "Minnesota",
            "Mississippi",
            "Missouri",
            "Montana",
            "Nebraska",
            "Nevada",
            "New Hampshire",
            "New Jersey",
            "New Mexico",
            "New York",
            "North Carolina",
            "North Dakota",
            "Ohio",
            "Oklahoma",
            "Oregon",
            "Pennsylvania",
            "Rhode Island",
            "South Carolina",
            "South Dakota",
            "Tennessee",
            "Texas",
            "Utah",
            "Vermont",
            "Virginia",
            "Washington",
            "West Virginia",
            "Wisconsin",
            "Wyoming"
        ]
    }
}

const getDataset = (id) => DATASETS[id];