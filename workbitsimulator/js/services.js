import { config } from './config.js';

export async function postReservation(data) {
    const url = config.api.base + "reservations/simulate";
    console.log("POST →", url, data);
    
    try {
        const response = await fetch(url, {
            method: "POST",
            mode: 'cors',
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`POST Reservation Error ${response.status}:`, errorText);
            return null;
        }

        const result = await response.json();
        console.log("Reservation created:", result);
        return result;
    } catch (error) {
        console.error("Network/CORS error in postReservation:", error);
        return null;
    }
}

export async function getTotals(date) {
    const url = config.api.base + "reservations/totals/" + date;
    console.log("GET →", url);
    
    try {
        const response = await fetch(url, {
            mode: 'cors',
            headers: { "Accept": "application/json" }
        });
        
        if (!response.ok) {
            console.error(`GET Totals Error ${response.status}`);
            return null;
        }
        
        const result = await response.json();
        console.log("Totals loaded:", result);
        return result;
    } catch (error) {
        console.error("Network/CORS error in getTotals:", error);
        return null;
    }
}

export async function logAccess(data) {
    const url = config.api.base + "accesslog";
    console.log("POST ACCESS LOG →", url, data);
    
    try {
        const response = await fetch(url, {
            method: "POST",
            mode: 'cors',
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`POST Access Log Error ${response.status}:`, errorText);
            return null;
        }

        const result = await response.json();
        console.log("Access logged:", result);
        return result;
    } catch (error) {
        console.error("Network/CORS error in logAccess:", error);
        return null;
    }
}

export async function getHourlyReservations(date) {
    const url = config.api.base + "reservations/hourly/" + date;
    console.log("GET →", url);
    
    try {
        const response = await fetch(url, {
            mode: 'cors',
            headers: { "Accept": "application/json" }
        });
        
        if (!response.ok) {
            console.error(`GET Hourly Reservations Error ${response.status}`);
            return null;
        }
        
        const result = await response.json();
        console.log("Hourly reservations loaded:", result);
        return result;
    } catch (error) {
        console.error("Network/CORS error in getHourlyReservations:", error);
        return null;
    }
}

export async function getHourlyAccess(date) {
    const url = config.api.base + "accesslog/hourly/" + date;
    console.log("GET →", url);
    
    try {
        const response = await fetch(url, {
            mode: 'cors',
            headers: { "Accept": "application/json" }
        });
        
        if (!response.ok) {
            console.error(`GET Hourly Access Error ${response.status}`);
            return null;
        }
        
        const result = await response.json();
        console.log("Hourly access loaded:", result);
        return result;
    } catch (error) {
        console.error("Network/CORS error in getHourlyAccess:", error);
        return null;
    }
}


