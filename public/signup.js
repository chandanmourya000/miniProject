// signUp.js

// Function to navigate to signUp.html
function navigateToSignUp() {
    window.location.href = "signUp.html"; // Redirects to signUp.html
}

// Wait for the page to load and then add the event listener to the Sign Up button
window.onload = function() {
    document.getElementById("signUpButton").addEventListener("click", navigateToSignUp);
};
/*
// Combined password validation (length and confirmation)
document.querySelector("form").addEventListener("submit", function(event) {
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirm-password").value;

    // Check if the password is at least 8 characters long
    if (password.length < 8) {
        alert("Password must be at least 8 characters long!");
        event.preventDefault();  // Prevent form submission
        return;  // Stop further execution
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        event.preventDefault();  // Prevent form submission
    }
});*/
