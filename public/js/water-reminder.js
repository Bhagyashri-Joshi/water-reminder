const reminderKey = "aquatrack-water-reminder-shown";

if (!sessionStorage.getItem(reminderKey)) {
  sessionStorage.setItem(reminderKey, "true");

  const reminder = document.createElement("div");
  reminder.className = "water-reminder";
  reminder.setAttribute("role", "status");
  reminder.setAttribute("aria-live", "polite");
  reminder.setAttribute("aria-atomic", "true");

  const message = document.createElement("p");
  message.textContent = "Hydration reminder: take a moment to drink some water.";

  const dismissButton = document.createElement("button");
  dismissButton.type = "button";
  dismissButton.className = "water-reminder-dismiss";
  dismissButton.setAttribute("aria-label", "Dismiss water reminder");
  dismissButton.textContent = "×";

  const dismiss = () => {
    window.clearTimeout(timeoutId);
    reminder.remove();
  };
  dismissButton.addEventListener("click", dismiss);

  reminder.append(message, dismissButton);
  document.body.append(reminder);

  const timeoutId = window.setTimeout(dismiss, 8000);
}
