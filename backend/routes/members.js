const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

const SCHEMA = process.env.LMS_SCHEMA || 'ADMIN';
const TABLE  = `${SCHEMA}.LMS_MEMBERS`;

/*
procedure to add member:CREATE OR REPLACE PROCEDURE ADMIN.add_patron_sp(
  p_name        IN  VARCHAR2,
  p_member_type IN  VARCHAR2 DEFAULT 'Student',
  p_email       IN  VARCHAR2 DEFAULT NULL,
  p_address     IN  VARCHAR2 DEFAULT NULL,
  p_phone       IN  VARCHAR2 DEFAULT NULL,
  p_new_id      OUT NUMBER
) AS
BEGIN
  INSERT INTO ADMIN.LMS_MEMBERS (full_name, member_type, join_date, email, address, phone)
  VALUES (p_name, p_member_type, SYSDATE, p_email, p_address, p_phone)
  RETURNING member_id INTO p_new_id;
END;
/

procedure to update member:CREATE OR REPLACE PROCEDURE ADMIN.update_patron_sp(
  p_member_id   IN NUMBER,
  p_email       IN VARCHAR2 DEFAULT NULL,
  p_member_type IN VARCHAR2 DEFAULT NULL,
  p_address     IN VARCHAR2 DEFAULT NULL,
  p_phone       IN VARCHAR2 DEFAULT NULL
) AS
BEGIN
  UPDATE ADMIN.LMS_MEMBERS
     SET email       = COALESCE(p_email, email),
         member_type = COALESCE(p_member_type, member_type),
         address     = COALESCE(p_address, address),
         phone       = COALESCE(p_phone, phone)
   WHERE member_id   = p_member_id;
END;
/
 */


// List all members
router.get('/', async (_req, res) => {
  try {
    const conn = await db.getConnection();
    const result = await conn.execute(
      `
      SELECT
        member_id   AS "id",
        full_name   AS "name",
        member_type AS "member_type",
        join_date   AS "join_date",
        email       AS "email",
        address     AS "address",
        phone       AS "phone"
      FROM ${TABLE}
      ORDER BY member_id
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await conn.close();
    res.json(result.rows);
  } catch (err) {
    console.error('List Members Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/members/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const conn = await db.getConnection();
    const result = await conn.execute(
      `
      SELECT
        member_id   AS "id",
        full_name   AS "name",
        member_type AS "member_type",
        join_date   AS "join_date",
        email       AS "email",
        address     AS "address",
        phone       AS "phone"
      FROM ${TABLE}
      WHERE member_id = :id
      `,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await conn.close();
    if (!result.rows.length) return res.status(404).json({ error: 'Member not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get Member Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/members  (calls ADMIN.add_patron_sp)
router.post('/', async (req, res) => {
  const { name, member_type, email, address, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const conn = await db.getConnection();
    const binds = {
      p_name: name,
      p_member_type: member_type || 'Student',
      p_email: email || null,
      p_address: address || null,
      p_phone: phone || null,
      p_new_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const r = await conn.execute(
      `BEGIN ADMIN.add_patron_sp(:p_name, :p_member_type, :p_email, :p_address, :p_phone, :p_new_id); END;`,
      binds,
      { autoCommit: true }
    );
    await conn.close();

    res.status(201).json({ message: 'Member added', id: r.outBinds.p_new_id });
  } catch (err) {
    console.error('Add Member Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/members/:id  (calls ADMIN.update_patron_sp)
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { email, member_type, address, phone } = req.body;

  try {
    const conn = await db.getConnection();
    await conn.execute(
      `BEGIN ADMIN.update_patron_sp(:id, :email, :member_type, :address, :phone); END;`,
      {
        id,
        email: email || null,
        member_type: member_type || null,
        address: address || null,
        phone: phone || null
      },
      { autoCommit: true }
    );
    await conn.close();
    res.json({ message: 'Member updated' });
  } catch (err) {
    console.error('Update Member Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/members/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const conn = await db.getConnection();
    const result = await conn.execute(
      `DELETE FROM ${TABLE} WHERE member_id = :id`,
      { id },
      { autoCommit: true }
    );
    await conn.close();

    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Member not found' });
    res.json({ message: 'Member deleted' });
  } catch (err) {
    console.error('Delete Member Error:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;