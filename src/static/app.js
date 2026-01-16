document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const categoryFilter = document.getElementById("category-filter");
  const nameFilter = document.getElementById("name-filter");
  const searchFilter = document.getElementById("search-filter");

  let allActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper: get category for activity name
  function getCategory(name, details) {
    // Simple mapping, can be improved
    const sports = ["Gym Class", "Soccer Team", "Basketball Team"];
    const academics = ["Programming Class", "Math Club", "Debate Team", "Chess Club"];
    const arts = ["Art Club", "Drama Club"];
    if (sports.includes(name)) return "Sports";
    if (academics.includes(name)) return "Academics";
    if (arts.includes(name)) return "Arts";
    return "Other";
  }

  // Render activities with filters
  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    const category = categoryFilter ? categoryFilter.value : "";
    const nameText = nameFilter ? nameFilter.value.toLowerCase() : "";
    const searchText = searchFilter ? searchFilter.value.toLowerCase() : "";

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityCategory = getCategory(name, details);
      // Filter by category
      if (category && activityCategory !== category) return;
      // Filter by name
      if (nameText && !name.toLowerCase().includes(nameText)) return;
      // Free text search (name, description, schedule)
      if (
        searchText &&
        !(
          name.toLowerCase().includes(searchText) ||
          details.description.toLowerCase().includes(searchText) ||
          details.schedule.toLowerCase().includes(searchText)
        )
      )
        return;

      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class=\"participants-section\">\n              <h5>Participants:</h5>\n              <ul class=\"participants-list\">\n                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class=\"participant-email\">${email}</span><button class=\"delete-btn\" data-activity=\"${name}\" data-email=\"${email}\">❌</button></li>`
                  )
                  .join("")}\n              </ul>\n            </div>`
          : `<p><em>No participants yet</em></p>`;
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <p><strong>Category:</strong> ${activityCategory}</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;
      activitiesList.appendChild(activityCard);
      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Add filter listeners
  if (categoryFilter) categoryFilter.addEventListener("change", renderActivities);
  if (nameFilter) nameFilter.addEventListener("input", renderActivities);
  if (searchFilter) searchFilter.addEventListener("input", renderActivities);

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
