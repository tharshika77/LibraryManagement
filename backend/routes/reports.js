const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

const S = process.env.LMS_SCHEMA || 'ADMIN';

// GET /api/reports/summary
router.get('/summary', async (_req, res) => {
  try {
    const conn = await db.getConnection();
    const r = await conn.execute(
      `
      SELECT
        (SELECT COUNT(*) FROM ${S}.LMS_BOOKS)              AS totalBooks,
        (SELECT COUNT(*) FROM ${S}.LMS_MEMBERS)            AS totalMembers,
        (SELECT COUNT(*) FROM ${S}.LMS_LOANS
          WHERE return_date IS NULL)                       AS activeLoans,
        (SELECT COUNT(*) FROM ${S}.LMS_LOANS
          WHERE return_date IS NULL AND due_date < SYSDATE) AS overdueLoans
      FROM dual
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await conn.close();
    res.json(r.rows[0]);
  } catch (err) {
    console.error('summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/loan-activity  (loans per month, just what exists)
router.get('/loan-activity', async (_req, res) => {
  try {
    const conn = await db.getConnection();
    const r = await conn.execute(
      `
      SELECT TO_CHAR(TRUNC(loan_date,'MM'),'YYYY-MM') AS label,
             COUNT(*) AS cnt
      FROM ${S}.LMS_LOANS
      GROUP BY TRUNC(loan_date,'MM')
      ORDER BY TRUNC(loan_date,'MM')
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await conn.close();

    // Frontend wants arrays
    res.json({
      labels: r.rows.map(x => x.LABEL),
      data:   r.rows.map(x => Number(x.CNT))
    });
  } catch (err) {
    console.error('loan-activity error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/top-books  (top 5 by times loaned)
router.get('/top-books', async (_req, res) => {
  try {
    const conn = await db.getConnection();
    const r = await conn.execute(
      `
      SELECT b.title AS "title",
             COUNT(l.loan_id) AS "timesBorrowed"
      FROM ${S}.LMS_BOOKS b
      JOIN ${S}.LMS_BOOK_COPIES bc ON bc.book_id = b.book_id
      JOIN ${S}.LMS_LOANS l        ON l.copy_id = bc.copy_id
      GROUP BY b.title
      ORDER BY "timesBorrowed" DESC
      FETCH FIRST 5 ROWS ONLY
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await conn.close();
    res.json(r.rows);
  } catch (err) {
    console.error('top-books error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;