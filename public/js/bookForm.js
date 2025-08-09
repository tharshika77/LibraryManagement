// Show/Hide UI Sections
function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// Fetch and render all books from backend API
async function fetchBooks() {
  try {
    const response = await fetch('/api/books');  // backend route
    if (!response.ok) throw new Error('Failed to fetch books');
    const books = await response.json();
    renderBooksTable(books);
  } catch (err) {
    alert('Error loading books: ' + err.message);
  }
}

function renderBooksTable(books) {
  const table = document.getElementById('booksTable');
  table.innerHTML = '';
  books.forEach(book => {
    const row = `
      <tr>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.isbn}</td>
        <td>${book.pub_year}</td>
        <td>
          <button onclick="editBook(${book.book_id})">Edit</button>
          <button onclick="deleteBook(${book.book_id})">Delete</button>
        </td>
      </tr>`;
    table.innerHTML += row;
  });
}

// Add Book - send data to backend
document.getElementById('addBookForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const publisher_id = Number(document.getElementById('publisher_id').value);
  const isbn = document.getElementById('isbn').value.trim();
  const pub_year = Number(document.getElementById('pub_year').value);

  // super simple checks
  if (!title || !author || !isbn || !publisher_id || !pub_year) {
    alert('Please fill out all fields.');
    return;
  }
  if (!Number.isInteger(pub_year) || pub_year < 1450 || pub_year > 2900) {
    alert('Publication year must be an integer between 1450 and 2900.');
    return;
  }
  if (!Number.isInteger(publisher_id) || publisher_id <= 0) {
    alert('Publisher ID must be a positive number.');
    return;
  }

  try {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, publisher_id, isbn, pub_year })
    });

    const data = await res.json();

    if (!res.ok) {
      // friendlier messages for common Oracle errors
      if ((data.error || '').includes('ORA-02290')) {
        alert('Error: Publication year must be between 1450 and 2900.');
      } else if ((data.error || '').includes('ORA-00001')) {
        alert('Error: That ISBN already exists.');
      } else if ((data.error || '').includes('ORA-02291')) {
        alert('Error: Publisher ID does not exist.');
      } else {
        alert('Error: ' + (data.error || 'Failed to add book'));
      }
      return;
    }

    alert('Book added!');
    e.target.reset();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// Edit Book - open form pre-filled (you can create a modal or redirect to edit page)
async function editBook(book_id) {
  try {
    const response = await fetch(`/api/books/${book_id}`);
    if (!response.ok) throw new Error('Failed to get book details');
    const book = await response.json();

    // Simple prompt example - replace with modal/form UI in real app
    const newTitle = prompt("Edit Title", book.title);
    if (newTitle === null) return;
    const newAuthor = prompt("Edit Author", book.author);
    if (newAuthor === null) return;

    const updatedBook = {...book, title: newTitle, author: newAuthor};

    const updateResponse = await fetch(`/api/books/${book_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBook)
    });

    if (!updateResponse.ok) throw new Error('Failed to update book');
    alert('Book updated!');
    fetchBooks();
  } catch (err) {
    alert(err.message);
  }
}

// Delete Book
async function deleteBook(book_id) {
  if (!confirm('Are you sure you want to delete this book?')) return;
  try {
    const response = await fetch(`/api/books/${book_id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete book');
    alert('Book deleted');
    fetchBooks();
  } catch (err) {
    alert(err.message);
  }
}

// Search books (front-end filtering or backend search API)
async function searchBooks() {
  const keyword = document.getElementById('searchInput').value.trim();
  if (keyword.length === 0) {
    fetchBooks();
    return;
  }

  try {
    // Example backend search API:
    const response = await fetch(`/api/books/search?keyword=${encodeURIComponent(keyword)}`);
    if (!response.ok) throw new Error('Search failed');
    const results = await response.json();

    const resultsList = document.getElementById('searchResults');
    resultsList.innerHTML = '';
    results.forEach(b => {
      const li = document.createElement('li');
      li.textContent = `${b.title} by ${b.author} (${b.pub_year})`;
      resultsList.appendChild(li);
    });
  } catch (err) {
    alert(err.message);
  }
}

// On page load, show view and fetch books
window.onload = () => {
  showSection('viewBooks');
  fetchBooks();
};
