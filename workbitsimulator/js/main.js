import { config } from './config.js';
import { postReservation, getTotals, logAccess, getHourlyReservations, getHourlyAccess, getConnectionStatus } from './services.js';
import { generateRealisticData, mockData } from './mockData.js';

// Global state
let intervalGenerate = null;
let intervalChart = null;
let intervalStats = null;
let currentHour = new Date().getHours();
let reservationsThisHour = 0;
let simulationRunning = false;

// Activity log management
const MAX_LOG_ENTRIES = 50;
let activityLog = [];

// Initialize application
window.addEventListener('load', init);

function init() {
    console.log('Workbit Simulator initialized...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Start periodic updates
    startPeriodicUpdates();
    
    // Update connection status immediately
    updateConnectionStatus();
    
    // Load initial data
    loadInitialData();
    
    // Initialize stats with mock data
    updateStatsDisplay();
    
    addActivityLog('Sistema iniciado', 'info');
}

function setupEventListeners() {
    document.getElementById('button-start').addEventListener('click', startSimulation);
    document.getElementById('button-stop').addEventListener('click', stopSimulation);
    document.getElementById('button-chart').addEventListener('click', loadChartData);
}

function startPeriodicUpdates() {
    // Update charts every 30 seconds
    intervalChart = setInterval(loadChartData, 30000);
    
    // Update stats every 10 seconds
    intervalStats = setInterval(updateStatsDisplay, 10000);
    
    // Update connection status every 30 seconds
    setInterval(updateConnectionStatus, 30000);
    
    // Simulate access every 20 seconds
    setInterval(simulateAccess, config.simulation.accessIntervalSeconds * 1000);
}

function startSimulation() {
    if (simulationRunning) {
        addActivityLog('La simulación ya está en ejecución', 'warning');
        return;
    }
    
    console.log('Iniciando simulación...');
    simulationRunning = true;
    generateReservation();
    
    // Update button states
    updateButtonStates();
    addActivityLog('Simulación iniciada', 'success');
}

function stopSimulation() {
    console.log('Deteniendo simulación...');
    simulationRunning = false;
    clearInterval(intervalGenerate);
    
    // Update button states
    updateButtonStates();
    addActivityLog('Simulación detenida', 'info');
}

function updateButtonStates() {
    const startBtn = document.getElementById('button-start');
    const stopBtn = document.getElementById('button-stop');
    
    if (simulationRunning) {
        startBtn.classList.add('opacity-50', 'cursor-not-allowed');
        startBtn.disabled = true;
        stopBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        stopBtn.disabled = false;
    } else {
        startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        startBtn.disabled = false;
        stopBtn.classList.add('opacity-50', 'cursor-not-allowed');
        stopBtn.disabled = true;
    }
}

async function updateConnectionStatus() {
    const status = getConnectionStatus();
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');
    
    if (status.connected) {
        indicator.className = 'w-3 h-3 rounded-full bg-success status-indicator';
        text.textContent = 'Conectado';
        text.className = 'text-sm text-textSecondary';
    } else {
        indicator.className = 'w-3 h-3 rounded-full bg-warning status-indicator';
        text.textContent = 'Modo Mock';
        text.className = 'text-sm text-warning';
    }
}

function updateStatsDisplay() {
    const data = generateRealisticData();
    
    document.getElementById('active-users').textContent = data.currentUsers;
    document.getElementById('total-reservations').textContent = data.totalReservations;
    document.getElementById('active-spaces').textContent = data.activeSpaces;
    document.getElementById('peak-hour').textContent = data.peakHour;
}

function loadInitialData() {
    const today = new Date().toISOString().split('T')[0];
    loadChartData(today);
}

async function loadChartData(specificDate = null) {
    const date = specificDate || new Date().toISOString().split('T')[0];
    
    try {
        addActivityLog('Cargando datos de gráficos...', 'info');
        
        // Load both charts in parallel
        const [reservationsData, accessData] = await Promise.all([
            getHourlyReservations(date),
            getHourlyAccess(date)
        ]);
        
        if (reservationsData) {
            drawChart('chart-hour', 'Reservas por Hora', reservationsData.hour, reservationsData.totals, date);
        }
        
        if (accessData) {
            drawChart('chart-access', 'Accesos por Hora', accessData.hour, accessData.totals, date);
        }
        
        addActivityLog('Gráficos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        addActivityLog('Error al cargar gráficos', 'error');
    }
}

function drawChart(containerId, title, categories, data, dateLabel = "") {
    const chartConfig = {
        chart: { 
            type: 'column',
            backgroundColor: 'transparent',
            style: {
                fontFamily: 'SF Pro Display, Roboto, system-ui, sans-serif'
            }
        },
        title: { 
            text: title,
            style: {
                color: '#424242',
                fontSize: '16px',
                fontWeight: '600'
            }
        },
        subtitle: { 
            text: dateLabel ? `Fecha: ${dateLabel}` : '',
            style: {
                color: '#757575',
                fontSize: '12px'
            }
        },
        xAxis: { 
            categories,
            labels: {
                style: {
                    color: '#757575',
                    fontSize: '11px'
                }
            },
            gridLineColor: '#E0E0E0'
        },
        yAxis: {
            min: 0,
            title: { 
                text: 'Cantidad',
                style: {
                    color: '#424242',
                    fontSize: '12px'
                }
            },
            labels: {
                style: {
                    color: '#757575',
                    fontSize: '11px'
                }
            },
            gridLineColor: '#E0E0E0'
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            column: {
                color: containerId === 'chart-hour' ? '#1976D2' : '#4CAF50',
                borderRadius: 2,
                borderWidth: 0
            }
        },
        series: [{
            name: title,
            data: data || []
        }],
        credits: {
            enabled: false
        }
    };
    
    Highcharts.chart(containerId, chartConfig);
}

// ====================== RESERVATIONS ======================

async function generateReservation() {
    const now = new Date();
    const hour = now.getHours();

    // Don't generate reservations on weekends
    if (now.getDay() === 0 || now.getDay() === 6) {
        console.log("Fin de semana: no se generan reservas");
        addActivityLog('No se generan reservas en fin de semana', 'info');
        scheduleNextReservation();
        return;
    }

    // Reset hourly counter when hour changes
    if (hour !== currentHour) {
        currentHour = hour;
        reservationsThisHour = 0;
    }

    // Check hourly limit
    if (reservationsThisHour >= config.simulation.maxReservationsPerHour) {
        console.log("Límite de reservas por hora alcanzado");
        addActivityLog(`Límite de ${config.simulation.maxReservationsPerHour} reservas/hora alcanzado`, 'warning');
        scheduleNextReservation();
        return;
    }

    try {
        const reservation = createReservationData(now);
        const response = await postReservation(reservation);
        
        if (response && (response.success || response.message)) {
            console.log("Reserva generada:", response);
            reservationsThisHour++;
            addActivityLog(`Reserva creada: ${reservation.spaceName} por ${reservation.ownerName}`, 'success');
        } else {
            addActivityLog('Error al crear reserva', 'error');
        }
    } catch (error) {
        console.error('Error generating reservation:', error);
        addActivityLog('Error al generar reserva', 'error');
    }

    scheduleNextReservation();
}

function createReservationData(now) {
    const duration = Math.floor(Math.random() * 3) + 1; // 1-3 hours
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    return {
        reason: mockData.reasons[Math.floor(Math.random() * mockData.reasons.length)],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "confirmed",
        spaceName: mockData.spaces[Math.floor(Math.random() * mockData.spaces.length)],
        ownerName: mockData.users[Math.floor(Math.random() * mockData.users.length)]
    };
}

function scheduleNextReservation() {
    if (!simulationRunning) return;
    
    clearInterval(intervalGenerate);
    const nextInterval = getMilliseconds();
    intervalGenerate = setTimeout(generateReservation, nextInterval);
}

function getMilliseconds() {
    const min = config.simulation.minIntervalMinutes * 60 * 1000;
    const max = config.simulation.maxIntervalMinutes * 60 * 1000;
    const ms = Math.random() * (max - min) + min;
    console.log(`Próxima reserva en ${(ms / 1000 / 60).toFixed(1)} minutos`);
    return ms;
}

// ====================== ACCESS SIMULATION ======================

async function simulateAccess() {
    const now = new Date();
    const userId = getRandomUserId();
    const allowedRooms = config.accessPermissions[userId] || [];

    if (allowedRooms.length === 0) {
        return;
    }

    const spaceId = allowedRooms[Math.floor(Math.random() * allowedRooms.length)];
    const reservationId = getValidReservationId(spaceId, userId);

    if (!reservationId) {
        console.warn(`No hay reserva válida para usuario ${userId} en espacio ${spaceId}`);
        return;
    }

    const accessLog = {
        user_id: userId,
        space_id: spaceId,
        reservation_id: reservationId,
        access_time: now.toISOString()
    };

    try {
        const response = await logAccess(accessLog);
        if (response && (response.success || response.message)) {
            console.log("Acceso registrado:", response);
            const userName = config.users.find(u => u.id === userId)?.name || `Usuario ${userId}`;
            const spaceName = config.spaces.find(s => s.id === spaceId)?.name || `Espacio ${spaceId}`;
            addActivityLog(`Acceso: ${userName} → ${spaceName}`, 'info');
            
            // Schedule exit
            const stayDuration = config.simulation.minStayMinutes + 
                Math.random() * (config.simulation.maxStayMinutes - config.simulation.minStayMinutes);
            
            setTimeout(() => {
                const exitLog = { ...accessLog, exit_time: new Date().toISOString() };
                logAccess(exitLog);
                addActivityLog(`Salida: ${userName} ← ${spaceName}`, 'info');
            }, stayDuration * 60 * 1000);
        }
    } catch (error) {
        console.error('Error logging access:', error);
        addActivityLog('Error al registrar acceso', 'error');
    }
}

function getRandomUserId() {
    const validUserIds = Object.keys(config.accessPermissions).map(Number);
    return validUserIds[Math.floor(Math.random() * validUserIds.length)];
}

function getValidReservationId(spaceId, userId) {
    const validReservations = config.validReservations.filter(
        r => r.space_id === spaceId && r.users.includes(userId)
    );
    
    if (validReservations.length === 0) return null;
    
    const selected = validReservations[Math.floor(Math.random() * validReservations.length)];
    return selected.id;
}

// ====================== ACTIVITY LOG ======================

function addActivityLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('es-ES');
    const logEntry = { message, type, timestamp };
    
    activityLog.unshift(logEntry);
    
    // Keep only the last MAX_LOG_ENTRIES
    if (activityLog.length > MAX_LOG_ENTRIES) {
        activityLog = activityLog.slice(0, MAX_LOG_ENTRIES);
    }
    
    updateActivityLogDisplay();
}

function updateActivityLogDisplay() {
    const container = document.getElementById('activity-log');
    
    container.innerHTML = activityLog.map(entry => {
        const iconMap = {
            success: { icon: 'check-circle', color: 'text-success' },
            error: { icon: 'x-circle', color: 'text-error' },
            warning: { icon: 'exclamation-triangle', color: 'text-warning' },
            info: { icon: 'information-circle', color: 'text-info' }
        };
        
        const config = iconMap[entry.type] || iconMap.info;
        
        return `
            <div class="flex items-center space-x-3 py-2 px-3 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                    <div class="w-2 h-2 rounded-full ${config.color}"></div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-textPrimary">${entry.message}</p>
                </div>
                <div class="flex-shrink-0">
                    <span class="text-xs text-textSecondary">${entry.timestamp}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Auto-scroll to top
    container.scrollTop = 0;
}
