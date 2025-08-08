const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

const S = process.env.LMS_SCHEMA || 'ADMIN';

/*
procedures: to loan book
CREATE OR REPLACE PROCEDURE ADMIN.loan_book_sp(
  p_isbn      IN  VARCHAR2,
  p_member_id IN  NUMBER,
  p_loan_date IN  DATE,
  p_due_date  IN  DATE,
  p_loan_id   OUT NUMBER
) AS
  v_book_id  NUMBER;
  v_copy_id  NUMBER;
BEGIN
  -- find the book id by isbn
  SELECT book_id INTO v_book_id
  FROM ADMIN.LMS_BOOKS
  WHERE isbn = p_isbn;

  -- pick the first available copy
  SELECT copy_id INTO v_copy_id
  FROM ADMIN.LMS_BOOK_COPIES
  WHERE book_id = v_book_id AND status = 'Available' AND ROWNUM = 1;

  -- insert the loan
  INSERT INTO ADMIN.LMS_LOANS (copy_id, member_id, loan_date, due_date)
  VALUES (v_copy_id, p_member_id, p_loan_date, p_due_date)
  RETURNING loan_id INTO p_loan_id;

  -- mark copy as loaned
  UPDATE ADMIN.LMS_BOOK_COPIES
  SET status = 'Loaned'
  WHERE copy_id = v_copy_id;

  COMMIT;
END;
/
// procedures: to return book
CREATE OR REPLACE PROCEDURE ADMIN.return_book_sp(
  p_loan_id IN NUMBER
) AS
  v_copy_id NUMBER;
BEGIN
  -- set return date
  UPDATE ADMIN.LMS_LOANS
  SET return_date = SYSDATE
  WHERE loan_id = p_loan_id;

  -- get the copy id back
  SELECT copy_id INTO v_copy_id
  FROM ADMIN.LMS_LOANS
  WHERE loan_id = p_loan_id;

  -- mark copy available
  UPDATE ADMIN.LMS_BOOK_COPIES
  SET status = 'Available'
  WHERE copy_id = v_copy_id;

  COMMIT;
END;
*/



// issue a loan
router.post('/', async (req, res) => {
  const { isbn, memberId, loanDate, dueDate } = req.body || {};
  try {
    const conn = await db.getConnection();
    const r = await conn.execute(
      `BEGIN ${S}.loan_book_sp(:isbn,:memberId,:loanDate,:dueDate,:loanId); END;`,
      {
        isbn,
        memberId,
        loanDate: new Date(loanDate),
        dueDate:  new Date(dueDate),
        loanId:   { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    await conn.close();
    res.status(201).json({ message: 'Loan created', loanId: r.outBinds.loanId });
  } catch (err) {
    console.error('Issue Loan Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// list active loans (very plain)
router.get('/active', async (_req, res) => {
  try {
    const conn = await db.getConnection();
    const sql = `
      SELECT
        l.loan_id                        AS "loanId",
        b.isbn                           AS "isbn",
        l.member_id                      AS "memberId",
        TO_CHAR(l.loan_date,'YYYY-MM-DD') AS "loanDate",
        TO_CHAR(l.due_date,'YYYY-MM-DD')  AS "dueDate",
        'Active'                          AS "status"
      FROM ${S}.LMS_LOANS l
      JOIN ${S}.LMS_BOOK_COPIES bc ON l.copy_id = bc.copy_id
      JOIN ${S}.LMS_BOOKS b        ON bc.book_id = b.book_id
      WHERE l.return_date IS NULL
      ORDER BY l.loan_id
    `;
    const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    await conn.close();
    res.json(result.rows);
  } catch (err) {
    console.error('Active Loans Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// return a loan
router.post('/:loanId/return', async (req, res) => {
  try {
    const conn = await db.getConnection();
    await conn.execute(
      `BEGIN ${S}.return_book_sp(:loanId); END;`,
      { loanId: req.params.loanId },
      { autoCommit: true }
    );
    await conn.close();
    res.json({ message: 'Book returned' });
  } catch (err) {
    console.error('Return Loan Error:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;