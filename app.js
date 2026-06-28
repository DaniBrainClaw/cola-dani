// Cola Dani — Núcleo OS — Visor estático (lee data.json)
// Auto-refresh cada 30s. Sin token. Sin CORS.

const DATA_URL = "data.json";
const REFRESH_MS = 30000;

const $ = (id) => document.getElementById(id);

function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
    });
}

function taskBadges(t) {
    const badges = [];
    if (t.hard_deadline) badges.push(`<span class="badge badge-hard">⏰</span>`);
    if (t.manual_priority) badges.push(`<span class="badge badge-priority">P${t.manual_priority}</span>`);
    if (t.task_type) badges.push(`<span class="badge badge-type">${t.task_type}</span>`);
    return badges.join("");
}

function renderTask(t, opts = {}) {
    const cls = [
        "task-item",
        t.hard_deadline ? "hard" : "",
        t.manual_priority ? "priority" : "",
        opts.cls || "",
    ].filter(Boolean).join(" ");

    return `
        <div class="${cls}">
            <div class="task-head">
                <div class="task-title">${escapeHtml(t.title)}</div>
                <div class="task-badges">${taskBadges(t)}</div>
            </div>
            <div class="task-meta">
                ${t.due_date ? `<span>📅 ${t.due_date}</span>` : ""}
                ${t.source ? `<span>📥 ${t.source}</span>` : ""}
                ${t.closed_at ? `<span>✅ cerrado ${fmtDate(t.closed_at)}</span>` : ""}
                ${t.created_at ? `<span>🕐 creado ${fmtDate(t.created_at)}</span>` : ""}
            </div>
        </div>
    `;
}

function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function render(snapshot) {
    if (!snapshot) {
        $("live-status").textContent = "error";
        return;
    }

    const s = snapshot.stats || {};

    // Métricas
    $("m-queued").textContent = s.queued ?? 0;
    $("m-serving").textContent = s.serving ?? 0;
    $("m-done").textContent = s.done ?? 0;
    $("m-failed").textContent = s.failed ?? 0;

    // Sirviendo
    const servingBody = $("serving-body");
    if (snapshot.serving) {
        servingBody.innerHTML = renderTask(snapshot.serving, { cls: "" });
    } else {
        servingBody.innerHTML = '<div class="empty">No hay tarea sirviendo ahora.</div>';
    }

    // Cola
    const queue = snapshot.queue || [];
    $("queue-count").textContent = queue.length;
    const queueList = $("queue-list");
    if (queue.length === 0) {
        queueList.innerHTML = '<div class="empty">Cola vacía.</div>';
    } else {
        queueList.innerHTML = queue.map(t => renderTask(t)).join("");
    }

    // Done recientes
    const done = snapshot.recent_done || [];
    const doneList = $("done-list");
    if (done.length === 0) {
        doneList.innerHTML = '<div class="empty">Sin cierres aún.</div>';
    } else {
        doneList.innerHTML = done.map(t => renderTask(t, { cls: "done" })).join("");
    }

    // Footer
    const updated = snapshot.generated_at_local || snapshot.generated_at;
    $("updated").textContent = "actualizado " + fmtDate(updated);
    $("footer-updated").textContent = "actualizado " + fmtDate(updated);
    $("live-status").textContent = "en vivo";
}

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

// Init
fetchSnapshot();
setInterval(fetchSnapshot, REFRESH_MS);

// Refresh manual
$("refresh-btn").addEventListener("click", fetchSnapshot);