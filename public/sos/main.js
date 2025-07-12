function showNotification(message, type) {
    const notification = document.getElementById("notification");
    const text = document.getElementById("notification-text");
  
    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove("hidden");
  
    // Trigger animation
    setTimeout(() => {
      notification.classList.add("show");
    }, 10); // small delay to allow DOM to apply the class
  
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.classList.add("hidden");
      }, 400); // match transition duration
    }, 3000);
  }

