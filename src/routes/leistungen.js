import {Router} from 'express'
import {pool} from '../db.js'

const router = Router()
router.get('/', async (req, res) => {
        const [rows] = await pool.query(
        'select id, name, dauer_min, preis from leistung where aktiv = 1 order by name'
    )
    res.json(rows)
})
export default router
