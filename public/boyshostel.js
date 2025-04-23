document.getElementById("filterBtn").addEventListener("click", function () {
    let maxPrice = document.getElementById("priceFilter").value.trim();
    let selectedSharing = document.getElementById("sharingFilter").value.trim().toLowerCase();
    let hostels = document.querySelectorAll(".hostel-card");

    hostels.forEach(hostel => {
        let hostelPrice = parseFloat(hostel.getAttribute("data-price"));
        let hostelSharing = hostel.getAttribute("data-sharing").toLowerCase(); // Convert to lowercase

        // Convert maxPrice to a number, default to Infinity if empty
        let maxPriceValue = maxPrice ? parseFloat(maxPrice) : Infinity;

        // Apply filters (case-insensitive for sharing)
        let priceMatch = hostelPrice <= maxPriceValue;
        let sharingMatch = selectedSharing === "" || hostelSharing.includes(selectedSharing);

        // Show/hide based on filters
        hostel.style.display = (priceMatch && sharingMatch) ? "" : "none";
    });
});

// Search box filter (case-insensitive)
document.getElementById("searchBox").addEventListener("input", function () {
    let filter = this.value.trim().toLowerCase();
    let hostels = document.querySelectorAll(".hostel-card");

    hostels.forEach(hostel => {
        let text = hostel.textContent.toLowerCase();
        hostel.style.display = text.includes(filter) ? "" : "none";
    });
});
