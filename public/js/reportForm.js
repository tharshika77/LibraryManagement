document.addEventListener("DOMContentLoaded", () => {
  async function loadReportData() {
    try {
      loadSummaryCards();

      const summaryData = await fetchSummaryData();
      updateSummaryCards(summaryData);

      const loanActivity = await fetchLoanActivity();
      renderLoanChart(loanActivity);

      const topBooks = await fetchTopBorrowedBooks();
      populateTopBooksTable(topBooks);
    } catch (error) {
      console.error("Error loading report data:", error);
      // TODO: Show user-friendly error messages here if needed
    }
  }

  // Fetch summary statistics from backend API
  async function fetchSummaryData() {
    const response = await fetch('/api/reports/summary');
    if (!response.ok) throw new Error('Failed to fetch summary data');
    return await response.json();
  }

  // Fetch loan activity data for the chart
  async function fetchLoanActivity() {
    const response = await fetch('/api/reports/loan-activity');
    if (!response.ok) throw new Error('Failed to fetch loan activity data');
    return await response.json();
  }

  // Fetch top borrowed books data
  async function fetchTopBorrowedBooks() {
    const response = await fetch('/api/reports/top-books');
    if (!response.ok) throw new Error('Failed to fetch top borrowed books data');
    return await response.json();
  }

  // Update summary cards in UI
  function updateSummaryCards(data) {
    document.getElementById("reportBooks").textContent = data.totalBooks ?? '--';
    document.getElementById("reportMembers").textContent = data.totalMembers ?? '--';
    document.getElementById("reportLoans").textContent = data.activeLoans ?? '--';
    document.getElementById("reportOverdue").textContent = data.overdueLoans ?? '--';
  }

  // Render Chart.js loan activity chart
  function renderLoanChart(loanData) {
    const ctx = document.getElementById("loanChart").getContext("2d");

    if (window.loanChartInstance) {
      window.loanChartInstance.destroy();
    }

    window.loanChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: loanData.labels,
        datasets: [{
          label: "Books Loaned",
          data: loanData.data,
          backgroundColor: "#4caf50",
          borderRadius: 5,
          hoverBackgroundColor: "#388e3c",
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "#ffffff" }
          },
          tooltip: {
            bodyColor: "#ffffff",
            titleColor: "#ffffff",
            backgroundColor: "#333"
          }
        },
        scales: {
          x: {
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.1)" }
          },
          y: {
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.1)" }
          }
        }
      }
    });
  }

  // Populate top borrowed books table
  function populateTopBooksTable(books) {
    const tableBody = document.querySelector("#topBooksTable tbody");
    tableBody.innerHTML = "";
    books.forEach(book => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${book.title}</td>
        <td>${book.timesBorrowed}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  function loadSummaryCards() {
    fetch('/api/reports/summary')
        .then(response => response.json())
        .then(data => {
            console.log('Summary data:', data);
            updateSummaryCards(data);
        })
        .catch(err => {
            console.error('Error loading summary cards:', err);
            updateSummaryCards({}); // fallback to empty
        });
}

function updateSummaryCards(data) {
    // Helper to get key in either camelCase or UPPERCASE
    const get = (obj, lower, upper) => obj[lower] ?? obj[upper] ?? '--';

    document.getElementById("reportBooks").textContent   = get(data, 'totalBooks',   'TOTALBOOKS');
    document.getElementById("reportMembers").textContent = get(data, 'totalMembers', 'TOTALMEMBERS');
    document.getElementById("reportLoans").textContent   = get(data, 'activeLoans',  'ACTIVELOANS');
    document.getElementById("reportOverdue").textContent = get(data, 'overdueLoans', 'OVERDUELOANS');
}

  loadReportData();
});
