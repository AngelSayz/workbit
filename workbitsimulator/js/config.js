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
        2: [1, 2, 3],
        3: [1],
        4: [2, 3],
        5: [1, 3],
        6: [2],
        7: [1, 2, 3],
        8: [3],
        9: [1, 2],
        10: [2, 3]
    },
    validReservations: [
        { id: 1, space_id: 2, users: [1] },
        { id: 2, space_id: 2, users: [4] },
        { id: 3, space_id: 2, users: [6, 2] },
        { id: 4, space_id: 1, users: [5] },
        { id: 8, space_id: 1, users: [3] },
        { id: 9, space_id: 1, users: [2, 5] },
        { id: 10, space_id: 1, users: [3] },
        { id: 11, space_id: 3, users: [7] },
        { id: 12, space_id: 3, users: [8, 9] },
        { id: 13, space_id: 1, users: [10] },
        { id: 14, space_id: 2, users: [1, 7] },
        { id: 15, space_id: 3, users: [4, 8] }
    ],
    spaces: [
        { id: 1, name: "Cubículo A" },
        { id: 2, name: "Cubículo B" },
        { id: 3, name: "Sala Oeste" },
        { id: 4, name: "Laboratorio 1" },
        { id: 5, name: "Sala de Juntas" },
        { id: 6, name: "Cubículo C" },
        { id: 7, name: "Cubículo D" },
        { id: 8, name: "Auditorio" }
    ],
    users: [
        { id: 1, name: "Ana García" },
        { id: 2, name: "Luis Rodríguez" },
        { id: 3, name: "María López" },
        { id: 4, name: "Carlos Hernández" },
        { id: 5, name: "Sofia Martínez" },
        { id: 6, name: "Diego Pérez" },
        { id: 7, name: "Valentina Torres" },
        { id: 8, name: "Santiago Morales" },
        { id: 9, name: "Isabella Cruz" },
        { id: 10, name: "Mateo Jiménez" }
    ],
    simulation: {
        maxReservationsPerHour: 3,
        minIntervalMinutes: 10,
        maxIntervalMinutes: 20,
        accessIntervalSeconds: 20,
        minStayMinutes: 20,
        maxStayMinutes: 60
    }
};
