// Cola Dani — Núcleo OS — Visor v3: HOY
// Estructura: Eventos del día → Tareas CRM hoy → Tarea actual (GRANDE) → Próximas (colapsable)

const DATA_URL = "data.json";
const REFRESH_MS = 30000;

const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
    });
}

function fmtToday() {
    const d = new Date();
    return d.toLocaleDateString("es-ES", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
    });
}

// ─── EVENTOS DEL DÍA ───
function renderEvents(events) {
    const body = $("events-body");
    $("events-count").textContent = events.length;
    if (events.length === 0) {
        body.innerHTML = '<div class="empty">Sin eventos en el calendario hoy.</div>';
        return;
    }
    body.innerHTML = events.map(ev => `
        <div class="event-item">
            <div class="event-time">${escapeHtml(ev.start || "??").substring(0, 5)}</div>
            <div class="event-body">
                <div class="event-title">${escapeHtml(ev.title)}</div>
                ${ev.location ? `<div class="event-loc">📍 ${escapeHtml(ev.location)}</div>` : ""}
            </div>
            ${ev.url ? `<a href="${escapeHtml(ev.url)}" target="_blank" class="event-link">📅</a>` : ""}
        </div>
    `).join("");
}

// ─── TAREAS CRM DEL DÍA ───
function renderCrmToday(tasks) {
    const body = $("crm-body");
    $("crm-count").textContent = tasks.length;
    if (tasks.length === 0) {
        body.innerHTML = '<div class="empty">Sin tareas en HubSpot para hoy.</div>';
        return;
    }
    body.innerHTML = tasks.map(t => {
        const statusClass = `status-${t.status || 'NOT_STARTED'}`;
        const statusLabel = (t.status || 'NOT_STARTED').replace(/_/g, ' ').toLowerCase();
        return `
            <div class="crm-item">
                <div class="crm-body">
                    <div class="crm-title">${escapeHtml(t.title)}</div>
                    <div class="crm-meta">
                        ${t.type ? `📋 ${escapeHtml(t.type)}` : ""}
                        ${t.due ? ` · 📅 ${escapeHtml(t.due)}` : ""}
                    </div>
                </div>
                <span class="crm-status ${statusClass}">${escapeHtml(statusLabel)}</span>
                ${t.url ? `<a href="${escapeHtml(t.url)}" target="_blank" class="crm-link">HubSpot →</a>` : ""}
            </div>
        `;
    }).join("");
}

// ─── TAREA ACTUAL (HERO) ───
function renderServing(t) {
    const hero = $("serving-hero");
    if (!t) {
        hero.classList.add("empty");
        hero.innerHTML = `
            <div class="serving-hero-header">
                <span class="serving-pill" style="background:#444;color:#aaa;">✓ COLA VACÍA</span>
            </div>
            <p style="font-size: 14px; margin-top: 10px;">No hay nada pendiente. ¡A descansar!</p>
        `;
        return;
    }
    hero.classList.remove("empty");

    $("serving-task-type").textContent = t.task_type || "general";
    $("serving-title").textContent = t.title;
    $("serving-desc").textContent = t.description || "(sin descripción)";

    // Meta chips
    const metaHtml = [];
    if (t.due_date) metaHtml.push(`<div class="meta-chip"><span class="meta-chip-label">vence</span> <span class="meta-chip-value">${t.due_date}</span></div>`);
    if (t.hard_deadline) metaHtml.push(`<div class="meta-chip hard"><span class="meta-chip-label">vencimiento</span> <span class="meta-chip-value">⏰ HOY</span></div>`);
    if (t.manual_priority) metaHtml.push(`<div class="meta-chip priority"><span class="meta-chip-label">prioridad</span> <span class="meta-chip-value">P${t.manual_priority}</span></div>`);
    if (t.contact_name) metaHtml.push(`<div class="meta-chip"><span class="meta-chip-label">contacto</span> <span class="meta-chip-value">${escapeHtml(t.contact_name)}</span></div>`);
    if (t.contact_phone) metaHtml.push(`<div class="meta-chip"><span class="meta-chip-label">📞</span> <span class="meta-chip-value">${escapeHtml(t.contact_phone)}</span></div>`);
    if (t.contact_email) metaHtml.push(`<div class="meta-chip"><span class="meta-chip-label">✉️</span> <span class="meta-chip-value">${escapeHtml(t.contact_email)}</span></div>`);
    $("serving-meta").innerHTML = metaHtml.join("");

    // Action buttons
    const actions = [];
    if (t.crm_url) actions.push(`<a href="${escapeHtml(t.crm_url)}" target="_blank" class="action-btn crm">🎯 Abrir en HubSpot</a>`);
    if (t.contact_url) actions.push(`<a href="${escapeHtml(t.contact_url)}" target="_blank" class="action-btn contact">👤 Contacto</a>`);
    if (t.contact_phone) actions.push(`<a href="tel:${escapeHtml(t.contact_phone)}" class="action-btn">📞</a>`);
    if (t.contact_email) actions.push(`<a href="mailto:${escapeHtml(t.contact_email)}" class="action-btn">✉️</a>`);
    $("serving-actions").innerHTML = actions.join("");

    // Criteria
    if (t.criteria && Object.keys(t.criteria).length > 0) {
        const criteriaHtml = Object.entries(t.criteria)
            .map(([k, v]) => `<code>${escapeHtml(k)}: ${escapeHtml(String(v))}</code>`)
            .join(" ");
        $("serving-criteria").innerHTML = `
            <div class="serving-criteria-label">Para cerrar, aportar:</div>
            ${criteriaHtml}
        `;
        $("serving-criteria").style.display = "block";
    } else {
        $("serving-criteria").style.display = "none";
    }
}

// ─── COLA (próximas) ───
function renderQueueItem(t) {
    const cls = [
        "queue-task",
        t.hard_deadline ? "hard" : "",
        t.manual_priority ? "priority" : "",
    ].filter(Boolean).join(" ");
    const badges = [];
    if (t.hard_deadline) badges.push(`<span class="badge badge-hard">⏰</span>`);
    if (t.manual_priority) badges.push(`<span class="badge badge-priority">P${t.manual_priority}</span>`);
    if (t.task_type) badges.push(`<span class="badge badge-type">${escapeHtml(t.task_type)}</span>`);

    const actions = [];
    if (t.crm_url) actions.push(`<a href="${escapeHtml(t.crm_url)}" target="_blank" class="link-btn crm">🎯 HubSpot</a>`);
    if (t.contact_url) actions.push(`<a href="${escapeHtml(t.contact_url)}" target="_blank" class="link-btn contact">👤</a>`);

    const meta = [];
    if (t.due_date) meta.push(`📅 ${t.due_date}`);
    if (t.contact_name) meta.push(`👤 ${escapeHtml(t.contact_name)}`);

    return `
        <div class="${cls}">
            <div class="queue-task-head">
                <div class="queue-task-title">${escapeHtml(t.title)}</div>
                <div class="queue-task-badges">${badges.join("")}</div>
            </div>
            <div class="queue-task-meta">${meta.join(" · ")}</div>
            ${actions.length > 0 ? `<div class="queue-task-actions">${actions.join("")}</div>` : ""}
        </div>
    `;
}

// ─── RENDER GLOBAL ───
function render(snapshot) {
    if (!snapshot) {
        $("live-status").textContent = "error";
        return;
    }

    $("subtitle").textContent = "HOY · " + fmtToday();

    renderEvents(snapshot.events_today || []);
    renderCrmToday(snapshot.crm_today || []);
    renderServing(snapshot.serving);

    // Cola
    const queue = snapshot.queue || [];
    $("queue-count").textContent = queue.length;
    const queueBody = $("queue-body");
    if (queue.length === 0) {
        queueBody.innerHTML = '<div class="empty">Cola vacía.</div>';
    } else {
        queueBody.innerHTML = queue.map(renderQueueItem).join("");
    }

    // Hechas
    const done = snapshot.recent_done || [];
    $("done-count").textContent = done.length;
    const doneBody = $("done-body");
    if (done.length === 0) {
        doneBody.innerHTML = '<div class="empty">Sin cierres aún.</div>';
    } else {
        doneBody.innerHTML = done.map(t => `
            <div class="done-task">
                <div class="done-task-title">✅ ${escapeHtml(t.title)}</div>
                <div class="done-task-meta">cerrado ${fmtDate(t.closed_at)}</div>
            </div>
        `).join("");
    }

    const updated = snapshot.generated_at_local || snapshot.generated_at;
    $("updated").textContent = "actualizado " + fmtDate(updated);
    $("footer-updated").textContent = "actualizado " + fmtDate(updated);
    $("live-status").textContent = "en vivo";
}

// ─── Toggles de secciones ───
function setupToggle(toggleId, bodyId, iconId) {
    $(toggleId).addEventListener("click", () => {
        const list = $(bodyId);
        const icon = $(iconId);
        const hidden = list.classList.toggle("hidden");
        icon.textContent = hidden ? "▶" : "▼";
    });
}
setupToggle("events-toggle", "events-body", "events-icon");
setupToggle("crm-toggle", "crm-body", "crm-icon");
setupToggle("queue-toggle", "queue-body", "queue-icon");
setupToggle("done-toggle", "done-body", "done-icon");

// ─── Fetch + auto-refresh ───
async function fetchSnapshot() {
    try {
        const res = await fetch(DATA_URL + "?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        render(data);
    } catch (err) {
        console.error("Error:", err);
        $("live-status").textContent = "sin conexión";
    }
}

fetchSnapshot();
setInterval(fetchSnapshot, REFRESH_MS);
$("refresh-btn").addEventListener("click", fetchSnapshot);