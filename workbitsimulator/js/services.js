import { config } from './config.js';

export async function postReservation(data) {
    const url = config.api.base + "reservations/simulate";
    console.log("POST →", url, data);
    return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(res => res.json())
      .catch(err => console.error(err));
}

export async function getTotals(date) {
    const url = config.api.base + "reservations/totals/" + date;
    console.log("GET →", url);
    return await fetch(url)
        .then(res => res.json())
        .catch(err => console.error(err));
}

export async function logAccess(data) {
    const url = config.api.base + "accesslog";
    console.log("POST ACCESS LOG →", url, data);
    return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(async res => {
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return await res.json();
    })
      .catch(err => console.error("Error en logAccess:", err));
}


export async function getHourlyReservations(date) {
    const url = config.api.base + "reservations/hourly/" + date;
    const res = await fetch(url);
    if (!res.ok) {
        console.error("❌ Error en getHourlyReservations", res.status);
        return null;
    }
    return await res.json();
}

export async function getHourlyAccess(date) {
    const url = config.api.base + "accesslog/hourly/" + date;
    const res = await fetch(url);
    if (!res.ok) {
        console.error("❌ Error en getHourlyAccess", res.status);
        return null;
    }
    return await res.json();
}


