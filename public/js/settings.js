const form = document.getElementById("settingsForm");
const input = document.getElementById("goalInput");
const notice = document.getElementById("settingsNotice");
function showNotice(message, error = false) {
  notice.textContent = message; notice.className = `notice${error ? " error" : ""}`; notice.hidden = false;
}
async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "Content-Type":"application/json", ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
(async function loadSettings() {
  try { const settings = await api("/api/settings"); input.value = settings.daily_goal_ml; }
  catch (error) { showNotice(`${error.message} Check your server and MySQL setup.`, true); }
})();
form.addEventListener("submit", async event => {
  event.preventDefault();
  const goal = Number(input.value);
  if (!Number.isInteger(goal) || goal < 250 || goal > 10000) return showNotice("Choose a goal between 250 and 10,000 ml.", true);
  try { const result = await api("/api/settings", { method:"PUT", body:JSON.stringify({daily_goal_ml:goal}) }); showNotice(result.message); }
  catch (error) { showNotice(error.message, true); }
});
