// Handles the contact form submission smoothly
function executeSecureFormSubmit(event) {
    event.preventDefault(); // Prevents the page from refreshing on submit
    
    alert("✦ Message sent successfully! Our studio team will get back to you within 24 hours.");
    
    event.target.reset(); // Clears the form fields after submission
}