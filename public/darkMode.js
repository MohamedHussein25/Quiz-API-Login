
document.addEventListener("DOMContentLoaded", () => {
  const darkToggle = document.getElementById("darkToggle");

  // Apply dark mode from localStorage
  const darkModeEnabled = localStorage.getItem("darkMode") === "true";
  if (darkModeEnabled) {
    document.body.classList.add("dark-mode");
    if (darkToggle) darkToggle.textContent = "☀️ Light Mode";
  }

  // Toggle logic
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("darkMode", isDark ? "true" : "false");
      darkToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    });
  }
});
