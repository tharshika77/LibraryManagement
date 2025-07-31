document.addEventListener("DOMContentLoaded", () => {
  loadMembers();

  // Button actions
  document.getElementById("btnAdd").addEventListener("click", () => showSection("addMember"));
  document.getElementById("btnView").addEventListener("click", () => showSection("viewMembers"));
  document.getElementById("btnSearch").addEventListener("click", () => showSection("searchMembers"));

  // Form submit
  document.getElementById("memberForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await addMember();
  });

  // Search bar
  document.getElementById("searchInput").addEventListener("input", searchMembers);
});

function showSection(id) {
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'none';
  });
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

  members.forEach(member => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${member.name}</td>
      <td>${member.email}</td>
      <td>${member.phone}</td>
      <td>
        <button onclick="editMember('${member.id}')">Edit</button>
        <button onclick="deleteMember('${member.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function addMember() {
  const member = {
    id: document.getElementById("memberId").value,
    name: document.getElementById("memberName").value,
    email: document.getElementById("memberEmail").value,
    phone: document.getElementById("memberPhone").value
  };

  const res = await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member)
  });

  if (res.ok) {
    loadMembers();
    document.getElementById("memberForm").reset();
    alert("Member added successfully!");
  } else {
    alert("Failed to add member");
  }
}

async function deleteMember(id) {
  if (confirm("Delete this member?")) {
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (res.ok) loadMembers();
    else alert("Failed to delete member");
  }
}

async function editMember(id) {
  const res = await fetch(`/api/members/${id}`);
  const member = await res.json();

  const newName = prompt("Edit Name:", member.name);
  const newEmail = prompt("Edit Email:", member.email);
  const newPhone = prompt("Edit Phone:", member.phone);

  if (!newName || !newEmail || !newPhone) return;

  const updated = { name: newName, email: newEmail, phone: newPhone };

  await fetch(`/api/members/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated)
  });

  loadMembers();
}

async function searchMembers() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const res = await fetch("/api/members");
  const members = await res.json();

  const results = members.filter(m =>
    m.name.toLowerCase().includes(query) ||
    m.email.toLowerCase().includes(query)
  );

  const ul = document.getElementById("searchResults");
  ul.innerHTML = "";

  results.forEach(m => {
    const li = document.createElement("li");
    li.textContent = `${m.name} - ${m.email} (${m.phone})`;
    ul.appendChild(li);
  });
}
