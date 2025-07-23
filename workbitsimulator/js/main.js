import { config } from './config.js';
import { postReservation, getTotals, logAccess, getHourlyReservations, getHourlyAccess } from './services.js';

let intervalGenerate = null;
let intervalChart = setInterval(loadChartData, config.simulator.chartUpdateInterval);
let currentHour = new Date().getHours();
let reservationsThisHour = 0;

window.addEventListener('load', init);

function init() {
    console.log('Simulator initialized...');
    
    document.getElementById('button-start').addEventListener('click', () => {
        console.log('Starting simulator...');
        updateStatus('Simulación iniciada - Generando reservas en tiempo real', 'success');
        if (intervalGenerate) {
            clearInterval(intervalGenerate);
        }
        generateReservation();
    });

    document.getElementById('button-stop').addEventListener('click', () => {
        console.log('Stopping simulator...');
        updateStatus('Simulación detenida', 'warning');
        if (intervalGenerate) {
            clearInterval(intervalGenerate);
            intervalGenerate = null;
        }
    });

    // Simulación de accesos
    setInterval(simulateAccess, config.simulator.accessInterval * 1000);

    document.getElementById('button-chart').addEventListener('click', () => {
        const currentDate = getTijuanaDateString();
        console.log(`Loading charts for current date: ${currentDate}`);
        updateStatus('Actualizando gráficas...', 'info');
        loadChartData();
    });

    // Mostrar fecha actual de Tijuana
    const currentDate = getTijuanaDateString();
    document.getElementById('current-date').textContent = formatDisplayDate(currentDate);
    updateStatus(`Sistema listo (${currentDate})`, 'success');

    // Cargar datos iniciales
    loadChartData();
}

function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        
        // Actualizar clases CSS según el tipo
        statusElement.className = 'status-indicator';
        if (type === 'success') {
            statusElement.style.backgroundColor = '#d1e7dd';
            statusElement.style.color = '#0a3622';
            statusElement.style.borderColor = '#badbcc';
        } else if (type === 'warning') {
            statusElement.style.backgroundColor = '#fff3cd';
            statusElement.style.color = '#664d03';
            statusElement.style.borderColor = '#ffecb5';
        } else if (type === 'danger') {
            statusElement.style.backgroundColor = '#f8d7da';
            statusElement.style.color = '#58151c';
            statusElement.style.borderColor = '#f5c2c7';
        } else {
            statusElement.style.backgroundColor = '#e3f2fd';
            statusElement.style.color = '#1976d2';
            statusElement.style.borderColor = '#bbdefb';
        }
    }
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// ====================== RESERVAS ======================

function generateReservation() {
    // Usar fecha y hora actual de Tijuana
    const now = getTijuanaDate();
    const hour = now.getHours();

    // No generar reservas en fines de semana
    if (now.getDay() === 0 || now.getDay() === 6) {
        console.log("Weekend: no reservations generated.");
        scheduleNextReservation();
        return;
    }

    // No generar reservas fuera de horario laboral
    if (hour < config.simulator.businessHours.start || hour > config.simulator.businessHours.end) {
        console.log("Outside business hours: no reservations generated.");
        scheduleNextReservation();
        return;
    }

    // Reiniciar el contador al cambiar de hora
    if (hour !== currentHour) {
        currentHour = hour;
        reservationsThisHour = 0;
    }

    // Límite de reservas por hora
    if (reservationsThisHour >= config.simulator.maxReservationsPerHour) {
        console.log("Reservation limit reached this hour.");
        scheduleNextReservation();
        return;
    }

    const duration = Math.floor(Math.random() * 3) + 1; // entre 1 y 3 horas
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    const reservation = {
        reason: "Simulación automática",
        startTime: getTijuanaISODate(startTime),
        endTime: getTijuanaISODate(endTime),
        status: "confirmed",
        spaceName: config.validSpaces[Math.floor(Math.random() * config.validSpaces.length)],
        ownerName: config.validUsers[Math.floor(Math.random() * config.validUsers.length)]
    };

    postReservation(reservation).then(response => {
        if (response) {
            console.log("Reservation generated successfully:", response);
            reservationsThisHour++;
            updateStatus(`Nueva reserva creada (${reservationsThisHour} esta hora)`, 'success');
        } else {
            console.warn("Failed to generate reservation");
            updateStatus('Error al generar reserva', 'danger');
        }
        scheduleNextReservation();
    }).catch(error => {
        console.error("Error generating reservation:", error);
        updateStatus('Error de conexión al generar reserva', 'danger');
        scheduleNextReservation();
    });
}

function scheduleNextReservation() {
    if (intervalGenerate) {
        clearInterval(intervalGenerate);
    }
    const nextInterval = getMilliseconds();
    intervalGenerate = setInterval(generateReservation, nextInterval);
}

function getMilliseconds() {
    const min = config.simulator.reservationInterval.min * 1000; 
    const max = config.simulator.reservationInterval.max * 1000; 
    const ms = Math.random() * (max - min) + min;
    console.log(`Next reservation in ${(ms / 1000 / 60).toFixed(1)} minutes`);
    return ms;
}

// ====================== GRAFICAR ======================

function loadChartData() {
    // Usar la fecha actual de Tijuana (misma zona horaria que las reservas)
    const date = getTijuanaDateString();
    console.log(`Loading charts for current date (Tijuana): ${date}`);
    loadChartDataForDate(date);
}

function loadChartDataForDate(date) {
    console.log(`Loading chart data for ${date}`);

    // Gráfico 1: reservas por hora
    getHourlyReservations(date).then(data => {
        if (data && data.hour && data.totals) {
            drawChart('chart-hour', 'Reservas por Hora', data.hour, data.totals, date);
        } else {
            // Si no hay datos, mostrar un gráfico vacío
            drawChart('chart-hour', 'Reservas por Hora', 
                Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0') + ':00'), 
                new Array(24).fill(0), date);
        }
    }).catch(error => {
        console.error("Error loading reservation chart:", error);
        drawChart('chart-hour', 'Reservas por Hora (Sin datos)', [], [], date);
        updateStatus('Error al cargar gráfica de reservas', 'danger');
    });

    // Gráfico 2: accesos por hora
    getHourlyAccess(date).then(data => {
        if (data && data.hour && data.totals) {
            drawChart('chart-access', 'Accesos por Hora', data.hour, data.totals, date);
        } else {
            // Si no hay datos, mostrar un gráfico vacío
            drawChart('chart-access', 'Accesos por Hora', 
                Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0') + ':00'), 
                new Array(24).fill(0), date);
        }
    }).catch(error => {
        console.error("Error loading access chart:", error);
        drawChart('chart-access', 'Accesos por Hora (Sin datos)', [], [], date);
        updateStatus('Error al cargar gráfica de accesos', 'danger');
    });
    
    updateStatus('Gráficas actualizadas correctamente', 'success');
}

function drawChart(containerId, title, categories, data, dateLabel = "") {
    // Asegurar que tenemos datos válidos
    const safeCategories = categories || [];
    const safeData = data || [];
    
    const chartColor = containerId === 'chart-hour' ? '#667eea' : '#43e97b';
    
    Highcharts.chart(containerId, {
        chart: { 
            type: 'column',
            backgroundColor: 'transparent',
            style: {
                fontFamily: 'Inter, sans-serif'
            }
        },
        title: { 
            text: null // No mostrar título ya que está en el card header
        },
        subtitle: { 
            text: dateLabel ? `${dateLabel}` : '',
            style: {
                fontSize: '11px',
                color: '#6c757d'
            }
        },
        xAxis: { 
            categories: safeCategories,
            title: {
                text: 'Hora del día',
                style: { fontSize: '11px' }
            },
            labels: {
                style: { fontSize: '10px' }
            }
        },
        yAxis: {
            min: 0,
            title: { 
                text: 'Cantidad',
                style: { fontSize: '11px' }
            },
            allowDecimals: false,
            labels: {
                style: { fontSize: '10px' }
            }
        },
        tooltip: {
            pointFormat: '<b>{point.y}</b> eventos',
            style: { fontSize: '12px' }
        },
        plotOptions: {
            column: {
                borderRadius: 4,
                borderWidth: 0
            }
        },
        series: [{
            name: title,
            data: safeData,
            color: chartColor,
            showInLegend: false
        }],
        credits: {
            enabled: false
        }
    });
}

// ====================== ACCESO SIMULADO ======================

function simulateAccess() {
    // Usar fecha y hora actual de Tijuana
    const now = getTijuanaDate();
    const hour = now.getHours();

    // No simular accesos fuera de horario laboral
    if (hour < config.simulator.businessHours.start || hour > config.simulator.businessHours.end) {
        console.log("Outside business hours: no access simulation.");
        return;
    }

    const userId = getRandomUserId();
    const allowedRooms = config.accessPermissions[userId] || [];

    if (allowedRooms.length === 0) {
        console.log(`No allowed rooms for user ${userId}`);
        return;
    }

    const spaceId = allowedRooms[Math.floor(Math.random() * allowedRooms.length)];
    const reservationId = getValidReservationId(spaceId, userId);

    if (!reservationId) {
        console.warn(`No valid reservation for user ${userId} in space ${spaceId}`);
        return;
    }

    const accessLog = {
        user_id: userId,
        space_id: spaceId,
        reservation_id: reservationId,
        access_time: getTijuanaISODate(now)
    };

    logAccess(accessLog).then(resp => {
        if (resp) {
            console.log("Access logged successfully:", resp);
        } else {
            console.warn("Failed to log access");
        }
    }).catch(error => {
        console.error("Error logging access:", error);
    });

    // Programar salida después de un tiempo aleatorio (20 min a 1 hora)
    const exitTime = 1200000 + Math.random() * (3600000 - 1200000);
    setTimeout(() => {
        const exitLog = {
            ...accessLog,
            exit_time: getTijuanaISODate(new Date())
        };
        
        logAccess(exitLog).then(resp => {
            if (resp) {
                console.log("Exit logged successfully");
            }
        }).catch(error => {
            console.error("Error logging exit:", error);
        });
    }, exitTime);
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

function getTijuanaDate() {
    // Obtener fecha actual en zona horaria de Tijuana
    const now = new Date();
    const tijuanaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Tijuana"}));
    return tijuanaTime;
}

function getTijuanaDateString() {
    // Obtener fecha actual de Tijuana en formato YYYY-MM-DD
    const tijuanaDate = getTijuanaDate();
    const year = tijuanaDate.getFullYear();
    const month = String(tijuanaDate.getMonth() + 1).padStart(2, '0');
    const day = String(tijuanaDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTijuanaISODate(date = new Date()) {
    const tz = 'America/Tijuana';
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(date);

    const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));

    return `${obj.year}-${obj.month}-${obj.day}T${obj.hour}:${obj.minute}:${obj.second}`;
}

