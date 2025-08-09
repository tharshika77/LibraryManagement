document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/reports/dashboard-stats');
    if (!res.ok) throw new Error('Failed to load dashboard stats');
    const data = await res.json();

    // Fill the cards
    setText('totalBooks',   data.totalBooks);
    setText('totalMembers', data.totalMembers);
    setText('activeLoans',  data.activeLoans);
    setText('overdueLoans', data.overdueLoans);
  } catch (err) {
    console.error(err);
    // leave defaults or show dashes
    ['totalBooks','totalMembers','activeLoans','overdueLoans'].forEach(id => setText(id, '--'));
  }
});

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = (val ?? '--');
}