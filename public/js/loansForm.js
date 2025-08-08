document.addEventListener('DOMContentLoaded', () => {
  const loanForm = document.getElementById('loanForm');
  const loansTableBody = document.querySelector('#loansTable tbody');
  const fineTableBody = document.querySelector('#fineTable tbody');

  // === Event: Submit Loan Form ===
  loanForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const isbn = document.getElementById('loanBookISBN').value.trim();
    const memberId = document.getElementById('loanMemberID').value.trim();
    const loanDate = document.getElementById('loanDate').value;
    const dueDate = document.getElementById('dueDate').value;

    if (!isbn || !memberId || !loanDate || !dueDate) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      // Call backend API or stored procedure to add loan
      // Example using fetch; update URL and payload as needed
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn, memberId, loanDate, dueDate })
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || 'Failed to issue book loan.');
      }

      alert('Book issued successfully.');
      loanForm.reset();
      await loadLoans();
      //await loadFines();

    } catch (error) {
      alert('Error: ' + error.message);
    }
  });

  // === Load Active Loans from backend ===
  async function loadLoans() {
    try {
      const response = await fetch('/api/loans/active');
      if (!response.ok) throw new Error('Failed to load loans.');
      const loans = await response.json();

      renderLoans(loans);

    } catch (error) {
      loansTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${error.message}</td></tr>`;
    }
  }

  // === Render loans in the table ===
  function renderLoans(loans) {
    loansTableBody.innerHTML = '';

    if (!loans.length) {
      loansTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No active loans</td></tr>`;
      return;
    }

    loans.forEach(loan => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${loan.isbn}</td>
        <td>${loan.memberId}</td>
        <td>${loan.loanDate}</td>
        <td>${loan.dueDate}</td>
        <td>${loan.status}</td>
        <td>
          <button class="return-btn" data-loan-id="${loan.loanId}">Return</button>
        </td>
      `;
      loansTableBody.appendChild(row);
    });
  }

  // === Handle Return Button Click ===
  loansTableBody.addEventListener('click', async (event) => {
    if (event.target.classList.contains('return-btn')) {
      const loanId = event.target.dataset.loanId;
      if (!loanId) return;

      if (!confirm('Confirm return of this book?')) return;

      try {
        const response = await fetch(`/api/loans/${loanId}/return`, {
          method: 'POST'
        });
        if (!response.ok) {
          const errMsg = await response.text();
          throw new Error(errMsg || 'Failed to return book.');
        }

        alert('Book returned successfully.');
        await loadLoans();
        //await loadFines();

      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  });

  // === Load Overdue Fines from backend ===
  async function loadFines() {
    try {
      const response = await fetch('/api/fines/overdue');
      if (!response.ok) throw new Error('Failed to load fines.');
      const fines = await response.json();

      renderFines(fines);

    } catch (error) {
      fineTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${error.message}</td></tr>`;
    }
  }

  // === Render fines in the table ===
  function renderFines(fines) {
    fineTableBody.innerHTML = '';

    if (!fines.length) {
      fineTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No overdue fines</td></tr>`;
      return;
    }

    fines.forEach(fine => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${fine.loanId}</td>
        <td>${fine.memberId}</td>
        <td>${fine.isbn}</td>
        <td>${fine.dueDate}</td>
        <td>$${fine.fineAmount.toFixed(2)}</td>
        <td>${fine.paid ? 'Paid' : 'Unpaid'}</td>
      `;
      fineTableBody.appendChild(row);
    });
  }

  // === Initial load ===
  loadLoans();
  //loadFines();
});
