document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryCards = document.querySelectorAll('.port-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 1. Swap active visual CSS highlight tabs
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // FIX: Grabs 'data-filter' instead of the broken 'data-target-filter'
            const selectedFilter = button.getAttribute('data-filter');

            // 2. Hide or Show matching element cards
            galleryCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (selectedFilter === 'all' || cardCategory === selectedFilter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});