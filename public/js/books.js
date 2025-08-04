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
        <td>${book.genre}</td>
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
document.getElementById('addBookForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const newBook = {
    title: this.title.value,
    author: this.author.value,
    genre: this.genre.value,
    isbn: this.isbn.value,
    pub_year: parseInt(this.year.value),
  };
  try {
    const response = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBook)
    });
    if (!response.ok) throw new Error('Failed to add book');
    alert('Book added successfully!');
    this.reset();
    showSection('viewBooks');
    fetchBooks();
  } catch (err) {
    alert(err.message);
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
