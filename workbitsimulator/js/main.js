import { config } from './config.js';
import { postReservation, getTotals, logAccess, getHourlyReservations, getHourlyAccess } from './services.js';



let intervalGenerate = null;
let intervalChart = setInterval(loadChartData, 30000);
let currentHour = new Date().getHours();
let reservationsThisHour = 0;
const maxReservationsPerHour = 3;


window.addEventListener('load', init);

function init() {
    console.log('Simulator initialized...');
    
    document.getElementById('button-start').addEventListener('click', () => {
        console.log('Starting simulator...');
        generateReservation();
    });

    document.getElementById('button-stop').addEventListener('click', () => {
        console.log('Stopping simulator...');
        clearInterval(intervalGenerate);
    });

    // Simulación de accesos cada 20 segundos
    setInterval(simulateAccess, 20000);

    document.getElementById('button-chart').addEventListener('click', () => {
    // mes 5 = junio (los meses van de 0 a 11)
    const date = new Date(2025, 6, 8);
    const dateString = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');

    console.log("📊 Fecha fija para gráficas:", dateString);

    getHourlyReservations(dateString).then(data => {
        drawChart('chart-hour', 'Reservas por Hora', data.hour, data.totals, dateString);
    });

    getHourlyAccess(dateString).then(data => {
        drawChart('chart-access', 'Accesos por Hora', data.hour, data.totals, dateString);
    });
});

}

// ====================== RESERVAS ======================

function generateReservation() {
    const now = new Date();
    const hour = now.getHours();

    if (now.getDay() === 0 || now.getDay() === 6) {
        console.log("Weekend: no reservations.");
        return;
    }

    // Reiniciar el contador al cambiar de hora
    if (hour !== currentHour) {
        currentHour = hour;
        reservationsThisHour = 0;
    }

    // Límite de reservas por hora
    if (reservationsThisHour >= maxReservationsPerHour) {
        console.log("Límite de reservas alcanzado esta hora.");
        return;
    }

    const duration = Math.floor(Math.random() * 3) + 1; // entre 1 y 3 horas
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    const validSpaces = ["Cubículo A", "Cubículo B", "Sala Oeste", "Laboratorio 1", "Sala de Juntas", "Cubículo C", "Cubículo D", "Auditorio"];
    const validUsers = ["Ana", "Luis", "María", "Carlos"];

    const reservation = {
        reason: "Simulación automática",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "confirmed",
        spaceName: validSpaces[Math.floor(Math.random() * validSpaces.length)],
        ownerName: validUsers[Math.floor(Math.random() * validUsers.length)]
    };

    postReservation(reservation).then(response => {
        if (response) {
            console.log("Reserva generada:", response);
            reservationsThisHour++;
        }
    });

    clearInterval(intervalGenerate);
    intervalGenerate = setInterval(generateReservation, getMilliseconds());
}

function getMilliseconds() {
    const min = 10 * 60 * 1000; // 10 minutos
    const max = 20 * 60 * 1000; // 20 minutos
    const ms = Math.random() * (max - min) + min;
    console.log(`Próxima reserva en ${(ms / 1000 / 60).toFixed(1)} minutos`);
    return ms;
}

// ====================== GRAFICAR ======================

function loadChartData() {
    const date = new Date().toISOString().split('T')[0];

    // Gráfico 1: reservas por hora
    getHourlyReservations(date).then(data => {
        drawChart('chart-hour', 'Reservas por Hora', data.hour, data.totals);
    });

    // Gráfico 2: accesos por hora
    getHourlyAccess(date).then(data => {
        drawChart('chart-access', 'Accesos por Hora', data.hour, data.totals);
    });
}

function drawChart(containerId, title, categories, data, dateLabel = "") {
    Highcharts.chart(containerId, {
        chart: { type: 'column' },
        title: { text: title },
        subtitle: { text: dateLabel },
        xAxis: { categories },
        yAxis: {
            min: 0,
            title: { text: 'Cantidad' }
        },
        series: [{
            name: title,
            data
        }]
    });
}



// ====================== ACCESO SIMULADO ======================

function simulateAccess() {
    const now = new Date();
    const userId = getRandomUserId(); // solo del 1 al 4
    const allowedRooms = config.accessPermissions[userId] || [];

    if (allowedRooms.length === 0) return;

    const spaceId = allowedRooms[Math.floor(Math.random() * allowedRooms.length)];
    const reservationId = getValidReservationId(spaceId, userId);

    if (!reservationId) {
        console.warn(`❗ No hay reserva válida para user ${userId} en espacio ${spaceId}`);
        return;
    }

    const accessLog = {
        user_id: userId,
        space_id: spaceId,
        reservation_id: reservationId,
        access_time: now.toISOString()
    };

    logAccess(accessLog).then(resp => {
        if (resp) {
            console.log("✔ Ingreso registrado:", resp);
        } else {
            console.warn("✖ Registro de ingreso fallido");
        }
    });

    setTimeout(() => {
        accessLog.exit_time = new Date().toISOString();
        logAccess(accessLog);
    }, 1200000 + Math.random() * (3600000 - 1200000)) ; // Salida entre 20 minutos y 1 hora después
}

function getRandomUserId() {
    const validUserIds = Object.keys(config.accessPermissions).map(Number);
    return validUserIds[Math.floor(Math.random() * validUserIds.length)];
}

function getValidReservationId(spaceId, userId) {
    const all = config.validReservations || [];
    const filtered = all.filter(r => r.space_id === spaceId && r.users.includes(userId));
    if (filtered.length === 0) return null;
    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    return selected.id;
}
