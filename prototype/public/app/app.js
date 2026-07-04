const API_BASE = "/api";

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

const state = { token: localStorage.getItem("cp_token") || null };

function setToken(token) {
  state.token = token;
  if (token) localStorage.setItem("cp_token", token);
  else localStorage.removeItem("cp_token");
}

async function apiFetch(path, opts = {}) {
  const headers = opts.headers || {};
  if (state.token) headers["Authorization"] = "Bearer " + state.token;
  opts.headers = headers;
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText || "Request failed");
  }
  return res.json().catch(() => ({}));
}

// Login form
qs("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = qs("#email").value.trim();
  const password = qs("#password").value;
  showLoginLoading(true);
  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    renderApp();
  } catch (err) {
    showError(err.message || "Login failed");
  } finally {
    showLoginLoading(false);
  }
});

qs("#btn-logout").addEventListener("click", () => {
  setToken(null);
  renderApp();
});

function showLoginLoading(on) {
  const btn = qs("#login-form button");
  btn.disabled = on;
  btn.textContent = on ? "Signing in..." : "Login";
}

function showError(msg) {
  alert(msg);
}

async function fetchJoinedRooms() {
  const data = await apiFetch("/rooms/joined");
  return data.rooms || [];
}

function formatAmount(amount) {
  return amount.toLocaleString();
}

function createRoomCard(room) {
  const tpl = qs("#room-card-template");
  const el = tpl.content.firstElementChild.cloneNode(true);
  qs(".room-name", el).textContent = room.name;
  qs(".room-purpose", el).textContent = room.purpose || "";
  qs(".room-amount", el).textContent = formatAmount(room.amount) + " UZS";
  qs(".room-joincode", el).textContent = room.joinCode;

  const fileInput = qs(".file-input", el);
  const statusArea = qs(".status-area", el);

  // If owner, add manage submissions button
  if (room.isOwner) {
    const manageBtn = document.createElement("button");
    manageBtn.className = "btn small";
    manageBtn.textContent = "View Submissions";
    manageBtn.style.marginLeft = "8px";
    manageBtn.addEventListener("click", async () => {
      // toggle submissions list
      if (statusArea.dataset.loaded === "true") {
        statusArea.innerHTML = "";
        statusArea.dataset.loaded = "false";
        return;
      }
      statusArea.innerHTML = '<div class="muted">Loading submissions...</div>';
      try {
        const data = await apiFetch(`/payments/room/${room.id}`);
        renderPaymentsList(statusArea, data.payments || [], room.id);
        statusArea.dataset.loaded = "true";
      } catch (err) {
        showLocalNotice(
          statusArea,
          err.message || "Failed to load submissions",
          "error",
        );
      }
    });
    const actions = qs(".actions", el);
    actions.appendChild(manageBtn);
  }

  function renderPaymentsList(container, payments, roomId) {
    container.innerHTML = "";
    // audit logs toggle button (owner view)
    const auditBtn = document.createElement("button");
    auditBtn.className = "btn small";
    auditBtn.textContent = "View Audit Logs";
    auditBtn.style.marginBottom = "8px";
    auditBtn.addEventListener("click", async () => {
      if (container.dataset.auditLoaded === "true") {
        // reload payments
        try {
          const data = await apiFetch(`/payments/room/${roomId}`);
          renderPaymentsList(container, data.payments || [], roomId);
        } catch (e) {
          showLocalNotice(container, e.message || "Failed to reload", "error");
        }
        container.dataset.auditLoaded = "false";
        return;
      }
      container.innerHTML = '<div class="muted">Loading audit logs...</div>';
      try {
        const res = await apiFetch(`/audit/room/${roomId}`);
        renderAuditLogs(container, res.logs || [], roomId);
        container.dataset.auditLoaded = "true";
      } catch (err) {
        showLocalNotice(
          container,
          err.message || "Failed to load audit logs",
          "error",
        );
      }
    });
    container.appendChild(auditBtn);

    if (!payments || payments.length === 0)
      return showLocalNotice(container, "No submissions yet", "info");
    payments.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.marginTop = "8px";
      const uploadedAt = p.uploadedAt
        ? new Date(p.uploadedAt).toLocaleString()
        : "just now";
      card.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${p.imagePath}" alt="receipt" style="width:96px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #eee" />
        <div style="flex:1">
          <div><strong>${p.user.name || p.user.email}</strong> — <span class="muted">${uploadedAt}</span></div>
          <div>Status: <strong>${p.status}</strong></div>
          ${p.reviewedByUser ? `<div>Reviewed by <strong>${p.reviewedByUser.name || p.reviewedByUser.email}</strong> at <span class="muted">${p.reviewedAt ? new Date(p.reviewedAt).toLocaleString() : ""}</span></div>` : ""}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${p.status === "pending" ? `<button data-id="${p.id}" class="btn approve">Approve</button><button data-id="${p.id}" class="btn small reject" style="background:var(--danger)">Reject</button>` : ""}
        </div>
      </div>
    `;
      // attach handlers
      if (p.status === "pending") {
        const approveBtn = card.querySelector(".approve");
        const rejectBtn = card.querySelector(".reject");
        approveBtn.addEventListener("click", async () => {
          approveBtn.disabled = true;
          approveBtn.textContent = "Approving...";
          try {
            const res = await apiFetch(`/payments/${p.id}/approve`, {
              method: "POST",
            });
            showLocalNotice(container, "Payment approved", "success");
            // refresh list
            const data = await apiFetch(`/payments/room/${p.roomId}`);
            renderPaymentsList(container, data.payments || [], p.roomId);
          } catch (err) {
            showLocalNotice(
              container,
              err.message || "Approve failed",
              "error",
            );
          }
        });
        rejectBtn.addEventListener("click", async () => {
          rejectBtn.disabled = true;
          rejectBtn.textContent = "Rejecting...";
          try {
            const res = await apiFetch(`/payments/${p.id}/reject`, {
              method: "POST",
            });
            showLocalNotice(container, "Payment rejected", "info");
            const data = await apiFetch(`/payments/room/${p.roomId}`);
            renderPaymentsList(container, data.payments || [], p.roomId);
          } catch (err) {
            showLocalNotice(container, err.message || "Reject failed", "error");
          }
        });
      }

      container.appendChild(card);
    });
  }

  function renderAuditLogs(container, logs, roomId) {
    container.innerHTML = "";
    if (!logs || logs.length === 0)
      return showLocalNotice(container, "No audit logs", "info");
    logs.forEach((l) => {
      const row = document.createElement("div");
      row.className = "audit-entry card";
      const actor = l.actor ? l.actor.name || l.actor.email : "system";
      const when = l.createdAt ? new Date(l.createdAt).toLocaleString() : "";
      row.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${l.action}</strong> — <span class="muted">${actor}</span></div><div class="muted">${when}</div></div><div style="margin-top:8px;font-size:13px;color:#334155">${l.details ? JSON.stringify(l.details) : ""}</div>`;
      container.appendChild(row);
    });
    const back = document.createElement("button");
    back.className = "btn small";
    back.textContent = "Back to submissions";
    back.style.marginTop = "8px";
    back.addEventListener("click", async () => {
      try {
        const data = await apiFetch(`/payments/room/${roomId}`);
        renderPaymentsList(container, data.payments || [], roomId);
        container.dataset.auditLoaded = "false";
      } catch (e) {
        showLocalNotice(container, e.message || "Failed to reload", "error");
      }
    });
    container.appendChild(back);
  }
  fileInput.addEventListener("change", (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    // validate image
    if (!file.type.startsWith("image/")) {
      showLocalNotice(statusArea, "Only image files allowed", "error");
      return;
    }
    uploadReceipt(room.id, file, statusArea);
  });

  return el;
}

function showLocalNotice(container, text, type = "info") {
  container.innerHTML = "";
  const d = document.createElement("div");
  d.className = `notice ${type}`;
  d.textContent = text;
  container.appendChild(d);
}

function renderRooms(rooms) {
  const root = qs("#rooms");
  root.innerHTML = "";
  if (rooms.length === 0)
    return (root.innerHTML =
      '<div class="card muted">You have not joined any rooms yet.</div>');
  rooms.forEach((r) => root.appendChild(createRoomCard(r)));
}

function renderApp() {
  const loggedIn = !!state.token;
  qs("#login-section").classList.toggle("hidden", loggedIn);
  qs("#dashboard").classList.toggle("hidden", !loggedIn);
  qs("#auth-area").style.display = loggedIn ? "block" : "none";
  if (loggedIn) loadDashboard();
}

async function loadDashboard() {
  try {
    const rooms = await fetchJoinedRooms();
    renderRooms(rooms);
  } catch (err) {
    showError(err.message || "Failed to load rooms");
  }
}

function uploadReceipt(roomId, file, statusArea) {
  statusArea.innerHTML = "";
  const progressBar = document.createElement("div");
  progressBar.className = "progress";
  const inner = document.createElement("span");
  progressBar.appendChild(inner);
  statusArea.appendChild(progressBar);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", API_BASE + "/payments");
  if (state.token)
    xhr.setRequestHeader("Authorization", "Bearer " + state.token);

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      inner.style.width = pct + "%";
    }
  });

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const res = JSON.parse(xhr.responseText);
        showUploadResult(statusArea, res.payment);
      } catch (e) {
        showLocalNotice(
          statusArea,
          "Uploaded but could not parse response",
          "info",
        );
      }
    } else {
      let msg = "Upload failed";
      try {
        msg = JSON.parse(xhr.responseText).error || msg;
      } catch (e) {}
      showLocalNotice(statusArea, msg, "error");
    }
  };

  const fd = new FormData();
  fd.append("roomId", roomId);
  fd.append("receipt", file, file.name);
  xhr.send(fd);
}

function showUploadResult(statusArea, payment) {
  statusArea.innerHTML = "";
  if (!payment)
    return showLocalNotice(statusArea, "Upload succeeded", "success");
  const div = document.createElement("div");
  div.className = "notice info";
  const uploadedAt = payment.uploadedAt
    ? new Date(payment.uploadedAt).toLocaleString()
    : "just now";
  div.innerHTML = `Receipt uploaded — <strong>${uploadedAt}</strong><br/>Status: <strong>${payment.status}</strong>`;
  statusArea.appendChild(div);
}

// initial render
renderApp();
