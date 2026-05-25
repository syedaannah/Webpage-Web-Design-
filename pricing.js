document.addEventListener('DOMContentLoaded', () => {
    const contextBadge = document.getElementById('serviceConfigBadge');
    const dynamicSelection = localStorage.getItem('intendedServiceSelection') || "General Character Design";
    contextBadge.textContent = `Target Pipeline Configuration: ${dynamicSelection} ✦`;
});

function capturePlanCheckout(tierName, unitCostValue) {
    localStorage.setItem('selectedTierName', tierName);
    localStorage.setItem('selectedTierCost', unitCostValue);
    window.location.href = 'orders.html';
}