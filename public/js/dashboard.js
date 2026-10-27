const $ = (id) => document.getElementById(id);
const amountInput = $("amountInput");
const historyDate = $("historyDate");
const today = new Date();
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
let selectedDate = localDate(today);
let isToday = true;

function showNotice(message, isError = false) {
  const el = $("notice"); el.textContent = message; el.className = `notice${isError ? " error" : ""}`; el.hidden = false;
  window.clearTimeout(showNotice.timer); showNotice.timer = window.setTimeout(() => { el.hidden = true; }, 3500);
}
async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed. Please try again.");
  return data;
}
function formatTime(value) {
  const time = String(value).slice(11,16);
  const [h,m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}
async function loadData() {
  try {
    const data = await api(`/api/water?date=${encodeURIComponent(selectedDate)}`);
    $("totalAmount").innerHTML = `${Number(data.total_ml).toLocaleString()} <span>ml</span>`;
    $("goalAmount").textContent = `${Number(data.goal_ml).toLocaleString()} ml`;
    $("progressPercent").textContent = `${data.progress_percent}%`;
    $("remainingText").textContent = data.remaining_ml ? `${Number(data.remaining_ml).toLocaleString()} ml to go` : "Daily goal reached";
    $("progressFill").style.width = `${Math.min(100, data.progress_percent)}%`;
    $("progressTrack").setAttribute("aria-valuenow", String(Math.min(100, data.progress_percent)));
    $("goalMessage").textContent = data.total_ml >= data.goal_ml ? "Great job — you've reached your goal!" : data.total_ml === 0 ? "You're off to a fresh start." : "Nice work. Keep sipping throughout the day.";
    $("todayLabel").textContent = isToday ? "Today" : new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
    $("historySummary").hidden = isToday;
    $("historySummary").textContent = `History for ${selectedDate}: ${Number(data.total_ml).toLocaleString()} ml of ${Number(data.goal_ml).toLocaleString()} ml goal (${data.progress_percent}%).`;
    renderEntries(data.entries);
  } catch (error) {
    $("entriesList").innerHTML = `<p class="empty-state">${escapeHtml(error.message)} Check your server and MySQL setup.</p>`;
    showNotice(error.message, true);
  }
}
function renderEntries(entries) {
  const list = $("entriesList");
  if (!entries.length) { list.innerHTML = '<p class="empty-state">No water entries for this date yet. Add your first drink above.</p>'; return; }
  list.innerHTML = entries.map(entry => `<div class="entry-row">
    <div class="entry-main"><div class="entry-icon"><img src="/images/water-logo.png" alt=""></div><div><div class="entry-amount">${Number(entry.amount_ml).toLocaleString()} ml</div><div class="entry-time">${formatTime(entry.logged_at)}</div></div></div>
    <div class="entry-actions"><button class="text-btn" data-edit="${entry.id}" data-amount="${entry.amount_ml}">Edit</button><button class="text-btn delete" data-delete="${entry.id}">Delete</button></div>
  </div>`).join("");
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
$("minusBtn").addEventListener("click", () => amountInput.value = Math.max(1, Number(amountInput.value || 0) - 50));
$("plusBtn").addEventListener("click", () => amountInput.value = Math.min(10000, Number(amountInput.value || 0) + 50));
document.querySelectorAll("[data-amount]").forEach(btn => btn.addEventListener("click", () => amountInput.value = btn.dataset.amount));
$("addForm").addEventListener("submit", async event => {
  event.preventDefault();
  const amount = Number(amountInput.value);
  if (!Number.isInteger(amount) || amount <= 0 || amount > 10000) return showNotice("Enter a whole number between 1 and 10,000 ml.", true);
  try {
    await api("/api/water", { method:"POST", body:JSON.stringify({ amount_ml:amount, date:selectedDate }) });
    amountInput.value = "250"; showNotice("Water entry added."); await loadData();
  } catch (error) { showNotice(error.message, true); }
});
$("entriesList").addEventListener("click", async event => {
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");
  if (edit) {
    const next = prompt("Update water amount (ml):", edit.dataset.amount);
    if (next === null) return;
    const amount = Number(next);
    if (!Number.isInteger(amount) || amount <= 0 || amount > 10000) return showNotice("Enter a whole number between 1 and 10,000 ml.", true);
    try { await api(`/api/water/${edit.dataset.edit}`, { method:"PUT", body:JSON.stringify({amount_ml:amount}) }); showNotice("Water entry updated."); await loadData(); }
    catch (error) { showNotice(error.message, true); }
  }
  if (del) {
    if (!confirm("Delete this water entry? This cannot be undone.")) return;
    try { await api(`/api/water/${del.dataset.delete}`, { method:"DELETE" }); showNotice("Water entry deleted."); await loadData(); }
    catch (error) { showNotice(error.message, true); }
  }
});
historyDate.max = localDate(today);
historyDate.value = selectedDate;
historyDate.addEventListener("change", () => {
  if (!historyDate.value) return;
  selectedDate = historyDate.value; isToday = selectedDate === localDate(new Date()); loadData();
});
loadData();
