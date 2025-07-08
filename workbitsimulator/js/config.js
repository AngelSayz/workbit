export var config = {
    api: {
        base: 'http://localhost:5260/api/'
    },
    receiveIntervals: [
        40, 40, 50, 50, 50, 40, 25, 20, 15, 10, 10, 20,
        25, 30, 30, 40, 50, 60, 70, 60, 50, 40, 40, 45
    ],
    accessPermissions: {
        1: [1, 2],
        2: [1, 2],
        3: [1],
        4: [2],
        5: [1],
        6: [2]
    },
    validReservations: [
        { id: 1, space_id: 2, users: [1] },
        { id: 2, space_id: 2, users: [4] },
        { id: 3, space_id: 2, users: [6, 2] },
        { id: 4, space_id: 1, users: [5] },
        { id: 8, space_id: 1, users: [3] },
        { id: 9, space_id: 1, users: [2, 5] },
        { id: 10, space_id: 1, users: [3] }
    ]
};
