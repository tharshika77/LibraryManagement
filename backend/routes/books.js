const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

const S = process.env.LMS_SCHEMA || 'ADMIN';

/*
 procedures: to add book
CREATE OR REPLACE PROCEDURE add_book_sp (
    p_title        IN VARCHAR2,
    p_author       IN VARCHAR2,
    p_publisher_id IN NUMBER,
    p_isbn         IN VARCHAR2,
    p_pub_year     IN NUMBER
) AS
BEGIN
    INSERT INTO lms_books (title, author, publisher_id, isbn, pub_year)
    VALUES (p_title, p_author, p_publisher_id, p_isbn, p_pub_year);

    COMMIT;
END;
/
 */

// GET /api/books  -> list all
router.get('/', async (_req, res) => {
  try {
    const conn = await db.getConnection();
    const sql = `
      SELECT
        book_id           AS "book_id",
        title             AS "title",
        author            AS "author",
        isbn              AS "isbn",
        pub_year          AS "pub_year"
      FROM ${S}.LMS_BOOKS
      ORDER BY book_id
    `;
    const r = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    await conn.close();

    // front-end expects 'genre' field, just send null
    const rows = r.rows.map(b => ({ ...b, genre: null }));
    res.json(rows);
  } catch (err) {
    console.error('Fetch Books Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/:id  -> single
router.get('/:id', async (req, res) => {
  try {
    const conn = await db.getConnection();
    const r = await conn.execute(
      `SELECT book_id AS "book_id", title AS "title", author AS "author",
              isbn AS "isbn", pub_year AS "pub_year"
       FROM ${S}.LMS_BOOKS WHERE book_id = :id`,
      { id: Number(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await conn.close();
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ...r.rows[0], genre: null });
  } catch (err) {
    console.error('Get Book Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books - Call stored procedure
router.post('/', async (req, res) => {
  const { title, author, publisher_id, isbn, pub_year } = req.body;

  try {
    const conn = await db.getConnection();

    await conn.execute(
      `BEGIN
         admin.add_book_sp(:title, :author, :publisher_id, :isbn, :pub_year);
       END;`,
      { title, author, publisher_id, isbn, pub_year },
      { autoCommit: true }
    );

    await conn.close();
    res.status(201).json({ message: 'Book added successfully' });

  } catch (err) {
    console.error('Add Book Error:', err);
    res.status(500).json({ error: err.message });
  }
});


// PUT /api/books/:id  -> super-basic update (no SP)
router.put('/:id', async (req, res) => {
  const { title, author, isbn, pub_year } = req.body || {};
  try {
    const conn = await db.getConnection();
    await conn.execute(
      `UPDATE ${S}.LMS_BOOKS
       SET title = :title, author = :author, isbn = :isbn, pub_year = :year
       WHERE book_id = :id`,
      { title, author, isbn, year: Number(pub_year), id: Number(req.params.id) },
      { autoCommit: true }
    );
    await conn.close();
    res.json({ message: 'Book updated' });
  } catch (err) {
    console.error('Update Book Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/books/:id  -> delete (no cascade checks here)
router.delete('/:id', async (req, res) => {
  try {
    const conn = await db.getConnection();
    await conn.execute(
      `DELETE FROM ${S}.LMS_BOOKS WHERE book_id = :id`,
      { id: Number(req.params.id) },
      { autoCommit: true }
    );
    await conn.close();
    res.json({ message: 'Book deleted' });
  } catch (err) {
    console.error('Delete Book Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/search?keyword=...
router.get('/search', async (req, res) => {
  const kw = (req.query.keyword || '').toUpperCase();
  try {
    const conn = await db.getConnection();
    const r = await conn.execute(
      `
      SELECT book_id AS "book_id", title AS "title", author AS "author",
             isbn AS "isbn", pub_year AS "pub_year"
      FROM ${S}.LMS_BOOKS
      WHERE UPPER(title)  LIKE '%'||:kw||'%'
         OR UPPER(author) LIKE '%'||:kw||'%'
      ORDER BY title
      `,
      { kw },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await conn.close();
    const rows = r.rows.map(b => ({ ...b, genre: null }));
    res.json(rows);
  } catch (err) {
    console.error('Search Books Error:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;