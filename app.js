// Cola Dani — Núcleo OS — Visor estático v2
// Sirviendo GRAnde, resto colapsable, links CRM.

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

function fmtDateShort(iso) {
    if (!iso) return "—";
    return iso.substring(0, 10); // YYYY-MM-DD
}

// ─── Render del SIRVIENDO (GRANDE) ───
function renderServing(t) {
    const hero = $("serving-hero");
    if (!t) {
        hero.classList.add("empty");
        hero.innerHTML = "<p style='font-size: 14px;'>Nada sirviendo ahora. La cola está procesada.</p>";
        return;
    }
    hero.classList.remove("empty");

    $("serving-task-type").textContent = t.task_type || "general";
    $("serving-title").textContent = t.title;
    $("serving-desc").textContent = t.description || "(sin descripción)";

    // Meta chips
    const metaHtml = [];
    metaHtml.push(`<div class="meta-chip"><span class="meta-chip-label">creado</span> <span class="meta-chip-value">${fmtDate(t.created_at)}</span></div>`);
    if (t.due_date) {
        metaHtml.push(`<div class="meta-chip"><span class="meta-chip-label">vence</span> <span class="meta-chip-value">${t.due_date}</span></div>`);
    }
    if (t.hard_deadline) {
        metaHtml.push(`<div class="meta-chip hard"><span class="meta-chip-label">vencimiento</span> <span class="meta-chip-value">⏰ HOY</span></div>`);
    }
    if (t.manual_priority) {
        metaHtml.push(`<div class="meta-chip priority"><span class="meta-chip-label">prioridad</span> <span class="meta-chip-value">P${t.manual_priority}</span></div>`);
    }
    if (t.contact_name) {
        metaHtml.push(`<div class="meta-chip"><span class="meta-chip-label">contacto</span> <span class="meta-chip-value">${escapeHtml(t.contact_name)}</span></div>`);
    }
    if (t.contact_phone) {
        metaHtml.push(`<div class="meta-chip"><span class="meta-chip-label">📞</span> <span class="meta-chip-value">${escapeHtml(t.contact_phone)}</span></div>`);
    }
    if (t.contact_email) {
        metaHtml.push(`<div class="meta-chip"><span class="meta-chip-label">✉️</span> <span class="meta-chip-value">${escapeHtml(t.contact_email)}</span></div>`);
    }
    $("serving-meta").innerHTML = metaHtml.join("");

    // Action buttons (links CRM + contacto)
    const actions = [];
    if (t.crm_url) {
        actions.push(`<a href="${escapeHtml(t.crm_url)}" target="_blank" class="action-btn crm">🎯 Abrir tarea en HubSpot</a>`);
    }
    if (t.contact_url) {
        actions.push(`<a href="${escapeHtml(t.contact_url)}" target="_blank" class="action-btn contact">👤 Ver contacto en HubSpot</a>`);
    }
    if (t.contact_phone) {
        actions.push(`<a href="tel:${escapeHtml(t.contact_phone)}" class="action-btn">📞 Llamar</a>`);
    }
    if (t.contact_email) {
        actions.push(`<a href="mailto:${escapeHtml(t.contact_email)}" class="action-btn">✉️ Email</a>`);
    }
    $("serving-actions").innerHTML = actions.join("");

    // Criteria (requisitos de evidencia)
    if (t.criteria && Object.keys(t.criteria).length > 0) {
        const criteriaHtml = Object.entries(t.criteria)
            .map(([k, v]) => `<code>${escapeHtml(k)}: ${escapeHtml(String(v))}</code>`)
            .join(" ");
        $("serving-criteria").innerHTML = `
            <div class="serving-criteria-label">Para cerrar, aportar evidencia de:</div>
            ${criteriaHtml}
        `;
        $("serving-criteria").style.display = "block";
    } else {
        $("serving-criteria").style.display = "none";
    }
}

// ─── Render de cola (colapsable) ───
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
    if (t.contact_url) actions.push(`<a href="${escapeHtml(t.contact_url)}" target="_blank" class="link-btn contact">👤 Contacto</a>`);
    if (t.contact_phone) actions.push(`<a href="tel:${escapeHtml(t.contact_phone)}" class="link-btn">📞</a>`);
    if (t.contact_email) actions.push(`<a href="mailto:${escapeHtml(t.contact_email)}" class="link-btn">✉️</a>`);

    const meta = [];
    if (t.due_date) meta.push(`<span>📅 ${t.due_date}</span>`);
    if (t.contact_name) meta.push(`<span>👤 ${escapeHtml(t.contact_name)}</span>`);

    return `
        <div class="${cls}">
            <div class="queue-task-head">
                <div class="queue-task-title">${escapeHtml(t.title)}</div>
                <div class="queue-task-badges">${badges.join("")}</div>
            </div>
            <div class="queue-task-meta">${meta.join("")}</div>
            ${actions.length > 0 ? `<div class="queue-task-actions">${actions.join("")}</div>` : ""}
        </div>
    `;
}

// ─── Render global ───
function render(snapshot) {
    if (!snapshot) {
        $("live-status").textContent = "error";
        return;
    }

    const s = snapshot.stats || {};
    $("m-queued").textContent = s.queued ?? 0;
    $("m-serving").textContent = s.serving ?? 0;
    $("m-done").textContent = s.done ?? 0;
    $("m-failed").textContent = s.failed ?? 0;

    renderServing(snapshot.serving);

    // Cola
    const queue = snapshot.queue || [];
    $("queue-count").textContent = queue.length;
    const queueList = $("queue-collapsed");
    if (queue.length === 0) {
        queueList.innerHTML = '<div class="empty">Cola vacía.</div>';
    } else {
        queueList.innerHTML = queue.map(renderQueueItem).join("");
    }

    // Done recientes
    const done = snapshot.recent_done || [];
    $("done-count").textContent = done.length;
    const doneList = $("done-collapsed");
    if (done.length === 0) {
        doneList.innerHTML = '<div class="empty">Sin cierres aún.</div>';
    } else {
        doneList.innerHTML = done.map(t => {
            const cls = "queue-task done";
            return `
                <div class="${cls}">
                    <div class="queue-task-head">
                        <div class="queue-task-title">✅ ${escapeHtml(t.title)}</div>
                    </div>
                    <div class="queue-task-meta">
                        <span>cerrado ${fmtDate(t.closed_at)}</span>
                    </div>
                </div>
            `;
        }).join("");
    }

    const updated = snapshot.generated_at_local || snapshot.generated_at;
    $("updated").textContent = "actualizado " + fmtDate(updated);
    $("footer-updated").textContent = "actualizado " + fmtDate(updated);
    $("live-status").textContent = "en vivo";
}

// ─── Toggles de colapso ───
$("queue-toggle").addEventListener("click", () => {
    const list = $("queue-collapsed");
    const icon = $("toggle-icon");
    const isHidden = list.classList.toggle("hidden");
    icon.textContent = isHidden ? "▶" : "▼";
});

$("done-toggle").addEventListener("click", () => {
    const list = $("done-collapsed");
    const icon = $("done-toggle-icon");
    const isHidden = list.classList.toggle("hidden");
    icon.textContent = isHidden ? "▶" : "▼";
});

// ─── Fetch + auto-refresh ───
async function fetchSnapshot() {
    try {
        const res = await fetch(DATA_URL + "?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        render(data);
    } catch (err) {
        console.error("Error cargando snapshot:", err);
        $("live-status").textContent = "sin conexión";
    }
}

fetchSnapshot();
setInterval(fetchSnapshot, REFRESH_MS);

$("refresh-btn").addEventListener("click", fetchSnapshot);