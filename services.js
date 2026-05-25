function routeToPricing(serviceKeyName) {
    // Persists the selection to configure pricing options
    localStorage.setItem('intendedServiceSelection', serviceKeyName);
    window.location.href = 'pricing.html';
}