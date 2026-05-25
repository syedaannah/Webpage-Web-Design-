function pushReviewToFeed(event) {
    event.preventDefault();
    
    const clientName = document.getElementById('formReviewName').value;
    const clientRole = document.getElementById('formReviewRole').value;
    const evaluationStars = document.getElementById('formReviewRating').value;
    const textNarrative = document.getElementById('formReviewText').value;

    // Get initials for profile picture icon placeholder structure
    const symbolInitials = clientName.split(" ").map(chunk => chunk[0]).join("").toUpperCase().substring(0,2) || "U";

    const feedbackNodeElement = document.createElement('div');
    feedbackNodeElement.className = 'review-card';
    feedbackNodeElement.innerHTML = `
        <div class="stars">${evaluationStars}</div>
        <div class="review-text">"${textNarrative}"</div>
        <div class="reviewer">
          <div class="avatar" style="background:linear-gradient(135deg,#85aef7,#b8f0d4)">${symbolInitials}</div>
          <div><div class="rev-name">${clientName}</div><div class="rev-role">${clientRole}</div></div>
        </div>
    `;

    document.getElementById('liveReviewsContainer').prepend(feedbackNodeElement);
    document.getElementById('submissionSystemReview').reset();
}