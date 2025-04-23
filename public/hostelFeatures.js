
// Global variables for user location
let userLat = null;
let userLng = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeMaps();
    locateUserAndCalculateDistances();
    setupSortHandler();
});

// 1. Initialize Leaflet Maps for all hostel cards
function initializeMaps() {
    const hostelCards = document.querySelectorAll(".hostel-card");

    hostelCards.forEach(card => {
        const lat = parseFloat(card.getAttribute("data-lat"));
        const lng = parseFloat(card.getAttribute("data-lng"));
        const mapId = card.querySelector("div[id^='map-']")?.id;

        if (!isNaN(lat) && !isNaN(lng) && mapId) {
            const map = L.map(mapId).setView([lat, lng], 15);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© OpenStreetMap'
            }).addTo(map);
            L.marker([lat, lng]).addTo(map).bindPopup("Hostel");
        }
    });
}

// 2. Get user location, calculate distances, update DOM, and optionally sort
function locateUserAndCalculateDistances() {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;

            const hostelCards = document.querySelectorAll(".hostel-card");
            hostelCards.forEach(card => {
                const hostelLat = parseFloat(card.getAttribute("data-lat"));
                const hostelLng = parseFloat(card.getAttribute("data-lng"));

                if (!isNaN(hostelLat) && !isNaN(hostelLng)) {
                    const distance = getDistanceFromLatLonInKm(userLat, userLng, hostelLat, hostelLng);
                    card.setAttribute("data-distance", distance);

                    const distanceElement = document.createElement("p");
                    distanceElement.textContent = `📍 Distance: ${distance.toFixed(2)} km`;
                    card.appendChild(distanceElement);
                }
            });

            // Auto-sort if distance sort is selected
            const sortValue = document.getElementById("sort")?.value;
            if (sortValue === "distance") sortHostelsByDistance();
        },
        (error) => {
            console.error("Geolocation error:", error);
            alert("Unable to get your location.");
        }
    );
}

// 3. Get directions via Google Maps
window.getDirections = function (hostelLat, hostelLng) {
    if (userLat !== null && userLng !== null) {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${hostelLat},${hostelLng}`;
        window.open(url, "_blank");
    } else {
        alert("Still getting your location. Please wait a moment.");
    }
};

// 4. Sort hostels by distance
function sortHostelsByDistance() {
    const hostelList = document.getElementById("hostel-list");
    const hostels = Array.from(hostelList.getElementsByClassName("hostel-card"));

    hostels.sort((a, b) => {
        const distA = parseFloat(a.getAttribute("data-distance"));
        const distB = parseFloat(b.getAttribute("data-distance"));
        return distA - distB;
    });

    hostels.forEach(hostel => hostelList.appendChild(hostel));
}

// Optional: React to dropdown sort change
function setupSortHandler() {
    const sortDropdown = document.getElementById("sort");
    if (sortDropdown) {
        sortDropdown.addEventListener("change", () => {
            if (sortDropdown.value === "distance") {
                sortHostelsByDistance();
            }
        });
    }
}

// Utility: Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
