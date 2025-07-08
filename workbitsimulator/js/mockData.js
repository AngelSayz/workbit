// Mock data for Workbit Simulator
// Provides fallback data when backend is not available

export const mockData = {
    // Mock data for hourly reservations endpoint
    getHourlyReservations: (date) => ({
        date: date,
        hour: [
            "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
            "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
            "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
            "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
        ],
        totals: [
            0, 0, 0, 0, 0, 0,
            1, 2, 4, 6, 8, 5,
            7, 9, 6, 8, 4, 3,
            2, 1, 0, 0, 0, 0
        ]
    }),

    // Mock data for hourly access logs endpoint
    getHourlyAccess: (date) => ({
        date: date,
        hour: [
            "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
            "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
            "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
            "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
        ],
        totals: [
            0, 0, 0, 0, 0, 1,
            3, 8, 12, 15, 18, 14,
            20, 22, 16, 19, 11, 7,
            4, 2, 1, 0, 0, 0
        ]
    }),

    // Mock response for reservation simulation
    postReservation: () => ({
        success: true,
        message: "Reserva simulada creada correctamente",
        data: {
            id: Math.floor(Math.random() * 1000) + 100,
            status: "confirmed"
        }
    }),

    // Mock response for access log
    logAccess: () => ({
        success: true,
        message: "Acceso registrado",
        data: {
            id: Math.floor(Math.random() * 1000) + 100,
            timestamp: new Date().toISOString()
        }
    }),

    // Mock response for totals endpoint
    getTotals: (date) => ({
        date: date,
        hour: [
            "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
            "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
            "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
            "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
        ],
        totals: [0, 0, 0, 0, 0, 0, 1, 2, 4, 6, 8, 5, 7, 9, 6, 8, 4, 3, 2, 1, 0, 0, 0, 0],
        minutes: [
            "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
            "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
            "20", "21", "22", "23", "24", "25", "26", "27", "28", "29",
            "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
            "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
            "50", "51", "52", "53", "54", "55", "56", "57", "58", "59"
        ],
        usage: Array.from({length: 60}, () => Math.floor(Math.random() * 10))
    }),

    // Sample data for realistic simulation
    spaces: [
        "Cubículo A", "Cubículo B", "Sala Oeste", 
        "Laboratorio 1", "Sala de Juntas", "Cubículo C", 
        "Cubículo D", "Auditorio", "Sala Norte", "Coworking"
    ],

    users: [
        "Ana García", "Luis Rodríguez", "María López", "Carlos Hernández",
        "Sofia Martínez", "Diego Pérez", "Valentina Torres", "Santiago Morales",
        "Isabella Cruz", "Mateo Jiménez"
    ],

    reasons: [
        "Reunión de equipo", "Sesión de trabajo", "Presentación cliente",
        "Capacitación", "Entrevista", "Reunión estratégica",
        "Desarrollo proyecto", "Revisión código", "Planificación sprint",
        "Demo producto"
    ]
};

// Utility function to generate realistic mock data with variations
export function generateRealisticData() {
    const now = new Date();
    const isWorkingHours = now.getHours() >= 7 && now.getHours() <= 19;
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    // Adjust data based on time and day
    const multiplier = isWorkingHours && isWeekday ? 1 : 0.3;
    
    return {
        currentUsers: Math.floor(Math.random() * 25 * multiplier),
        totalReservations: Math.floor(Math.random() * 50 * multiplier),
        activeSpaces: Math.floor(Math.random() * 8 * multiplier) + 1,
        peakHour: isWorkingHours ? `${now.getHours()}:00` : "14:00"
    };
} 