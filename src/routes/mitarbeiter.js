import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()
router.get('/', async (req, res) => {
    const leistung_id = Number(req.query.leistung_id)
    if (!Number.isInteger(leistung_id) || leistung_id < 1) {
        res.status(400).json({ fehler: 'kein integer' })
        return
    }
    const [rows] = await pool.execute(
        'select m.id, m.name from mitarbeiter m join mitarbeiter_leistung ml on m.id = ml.mitarbeiter_id where ml.leistung_id = ? and  m.aktiv = 1 order by m.name', [leistung_id]
    )
    res.json(rows)
})
export default router
