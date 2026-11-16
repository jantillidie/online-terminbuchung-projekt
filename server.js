import express from 'express'
import {pool} from './src/db.js'

const app = express()
app.use(express.json())
app.use(express.static('public'))

app.get('/api/leistungen', async (req, res) => {
    const [rows] = await pool.query(
        'select id, name, dauer_min, preis from leistung where aktiv = 1 order by name'
    )
    res.json(rows)
})

app.listen(process.env.PORT || 3000, () => console.log('läuft'))
