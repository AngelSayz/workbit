import { config } from './config.js';
import { mockData } from './mockData.js';

// Connection status tracking
let backendAvailable = true;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

// Test backend connection
async function testConnection() {
    const now = Date.now();
    if (now - lastConnectionCheck < CONNECTION_CHECK_INTERVAL) {
        return backendAvailable;
    }
    
    try {
        const response = await fetch(config.api.base + "reservations", {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        backendAvailable = response.ok;
        lastConnectionCheck = now;
        if (backendAvailable) {
            console.log("✅ Backend connected");
        }
    } catch (error) {
        backendAvailable = false;
        lastConnectionCheck = now;
        console.warn("⚠️ Backend not available, using mock data");
    }
    
    return backendAvailable;
}

export async function postReservation(data) {
    const isConnected = await testConnection();
    
    if (isConnected) {
        const url = config.api.base + "reservations/simulate";
        console.log("POST →", url, data);
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(10000)
            });
            return await response.json();
        } catch (err) {
            console.error("Backend error, falling back to mock:", err);
            backendAvailable = false;
            return mockData.postReservation();
        }
    } else {
        console.log("🔄 Using mock data for reservation");
        return mockData.postReservation();
    }
}

export async function getTotals(date) {
    const isConnected = await testConnection();
    
    if (isConnected) {
        const url = config.api.base + "reservations/totals/" + date;
        console.log("GET →", url);
        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(10000)
            });
            return await response.json();
        } catch (err) {
            console.error("Backend error, falling back to mock:", err);
            backendAvailable = false;
            return mockData.getTotals(date);
        }
    } else {
        console.log("🔄 Using mock data for totals");
        return mockData.getTotals(date);
    }
}

export async function logAccess(data) {
    const isConnected = await testConnection();
    
    if (isConnected) {
        const url = config.api.base + "accesslog";
        console.log("POST ACCESS LOG →", url, data);
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
            return await response.json();
        } catch (err) {
            console.error("Backend error, falling back to mock:", err);
            backendAvailable = false;
            return mockData.logAccess();
        }
    } else {
        console.log("🔄 Using mock data for access log");
        return mockData.logAccess();
    }
}

export async function getHourlyReservations(date) {
    const isConnected = await testConnection();
    
    if (isConnected) {
        const url = config.api.base + "reservations/hourly/" + date;
        try {
            const res = await fetch(url, {
                signal: AbortSignal.timeout(10000)
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.error("Backend error, falling back to mock:", err);
            backendAvailable = false;
            return mockData.getHourlyReservations(date);
        }
    } else {
        console.log("🔄 Using mock data for hourly reservations");
        return mockData.getHourlyReservations(date);
    }
}

export async function getHourlyAccess(date) {
    const isConnected = await testConnection();
    
    if (isConnected) {
        const url = config.api.base + "accesslog/hourly/" + date;
        try {
            const res = await fetch(url, {
                signal: AbortSignal.timeout(10000)
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.error("Backend error, falling back to mock:", err);
            backendAvailable = false;
            return mockData.getHourlyAccess(date);
        }
    } else {
        console.log("🔄 Using mock data for hourly access");
        return mockData.getHourlyAccess(date);
    }
}

// Export connection status for UI updates
export function getConnectionStatus() {
    return {
        connected: backendAvailable,
        lastCheck: lastConnectionCheck
    };
}


