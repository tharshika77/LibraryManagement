document.addEventListener("DOMContentLoaded", () => {
  loadMembers();

  document.getElementById("btnAdd").addEventListener("click", () => showSection("addMember"));
  document.getElementById("btnView").addEventListener("click", () => showSection("viewMembers"));
  document.getElementById("btnSearch").addEventListener("click", () => showSection("searchMembers"));

  document.getElementById("memberForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await addMember();
  });

  document.getElementById("searchInput").addEventListener("input", searchMembers);
});

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

async function loadMembers() {
  const res = await fetch("/api/members");
  const members = await res.json();
  renderMembersTable(members);
}

function renderMembersTable(members) {
  const tbody = document.querySelector("#membersTable tbody");
  tbody.innerHTML = "";

  members.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.id ?? ''}</td>
      <td>${m.name ?? ''}</td>
      <td>${m.member_type ?? ''}</td>
      <td>${m.email ?? ''}</td>
      <td>${m.address ?? ''}</td>
      <td>${m.phone ?? ''}</td>
      <td>
        <button onclick="editMember('${m.id}')">Edit</button>
        <button onclick="deleteMember('${m.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function addMember() {
  const payload = {
    name: document.getElementById("memberName").value.trim(),
    email: document.getElementById("memberEmail").value.trim() || null,
    member_type: document.getElementById("memberType").value,
    address: document.getElementById("memberAddress").value.trim() || null,
    phone: document.getElementById("memberPhone").value.trim() || null
  };

  if (!payload.name) {
    alert("Name is required");
    return;
  }

  const res = await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    await loadMembers();
    document.getElementById("memberForm").reset();
    alert("Member added successfully!");
    showSection("viewMembers");
  } else {
    const err = await res.json().catch(() => ({}));
    alert("Failed to add member" + (err.error ? `: ${err.error}` : ''));
  }
}

async function deleteMember(id) {
  if (!confirm("Delete this member?")) return;
  const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
  if (res.ok) loadMembers();
  else alert("Failed to delete member");
}

async function editMember(id) {
  const res = await fetch(`/api/members/${id}`);
  if (!res.ok) return alert("Failed to load member");
  const m = await res.json();

  const newName = prompt("Edit Name:", m.name ?? "");
  if (newName === null) return;

  const newType = prompt("Edit Type (Student/Faculty/Guest):", m.member_type ?? "Student");
  if (newType === null) return;

  const newEmail = prompt("Edit Email:", m.email ?? "");
  if (newEmail === null) return;

  const newAddress = prompt("Edit Address:", m.address ?? "");
  if (newAddress === null) return;

  const newPhone = prompt("Edit Phone:", m.phone ?? "");
  if (newPhone === null) return;

  const updated = {
    member_type: newType || null,
    email: newEmail || null,
    address: newAddress || null,
    phone: newPhone || null
  };

  const updRes = await fetch(`/api/members/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated)
  });

  if (updRes.ok) loadMembers();
  else alert("Failed to update member");
}

async function searchMembers() {
  const q = (document.getElementById("searchInput").value || "").toLowerCase();
  const res = await fetch("/api/members");
  const members = await res.json();

  const results = members.filter(m =>
    (m.name || '').toLowerCase().includes(q) ||
    (m.member_type || '').toLowerCase().includes(q) ||
    (m.email || '').toLowerCase().includes(q) ||
    (m.address || '').toLowerCase().includes(q)
  );

  const ul = document.getElementById("searchResults");
  ul.innerHTML = "";
  results.forEach(m => {
    const li = document.createElement("li");
    li.textContent = `${m.name} — ${m.member_type} — ${m.email || 'no email'} — ${m.address || ''} (${m.phone || ''})`;
    ul.appendChild(li);
  });
}
