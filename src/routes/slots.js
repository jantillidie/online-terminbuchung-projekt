import { Router } from 'express'
import { pool } from '../db.js'
import { toMin, toHHMM, OEFFNUNG, freieSlots } from '../regeln.js'

const router = Router()

router.get('/', async (req, res) => {
    const leistungId = Number(req.query.leistung_id)
    const maParam = req.query.mitarbeiter_id
    const datum = req.query.datum

    if (!Number.isInteger(leistungId) || leistungId < 1) {
        return res.status(400).json({ fehler: 'leistung_id muss eine positive Zahl sein' })
    }

    const egal = maParam === 'egal'
    const maId = Number(maParam)
    if (!egal && (!Number.isInteger(maId) || maId < 1)) {
        return res.status(400).json({ fehler: 'mitarbeiter_id muss eine Zahl oder "egal" sein' })
    }

    if (typeof datum !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
        return res.status(400).json({ fehler: 'datum muss das Format JJJJ-MM-TT haben' })
    }
    const tag = new Date(datum + 'T00:00:00')
    if (isNaN(tag) || tag.getDate() !== Number(datum.slice(8, 10))) {
        return res.status(400).json({ fehler: 'Ungültiges Datum' })
    }

    // Leistungen

    const [leistungen] = await pool.execute(
        'select dauer_min from leistung where id = ? and aktiv = 1', [leistungId]
    )
    if (leistungen.length === 0) {
        return res.status(404).json({ fehler: 'Leistung nicht gefunden' })
    }
    const dauer = leistungen[0].dauer_min

    // Geschlossen > keine Slots
    const zeiten = OEFFNUNG[tag.getDay()]
    if (!zeiten) return res.json([])

    // Kandidaten: Welcher MA kann welche DL
    const [koennen] = await pool.execute(
        'select m.id from mitarbeiter m join mitarbeiter_leistung ml on ml.mitarbeiter_id = m.id where ml.leistung_id = ? and m.aktiv = 1', [leistungId]
    )
    let kandidaten = koennen.map(m => m.id)
    if (!egal) {
        if (!kandidaten.includes(maId)) {
            return res.status(400).json({ fehler: 'Diese Person bietet die Leistung nicht an' })
        }
        kandidaten = [maId]
    }
    if (kandidaten.length === 0) return res.json([])

    // Belegte Zeiten des Tages
    const [termine] = await pool.query(
        'select mitarbeiter_id, time(beginn) as von, time(ende) as bis from termin where date(beginn) = ? and status <> "storniert" and mitarbeiter_id in (?)', [datum, kandidaten]
    )

    // freie Slots pro Person
    const alle = new Set()
    for (const id of kandidaten) {
        const belegt = termine
            .filter(t => t.mitarbeiter_id === id)
            .map(t => ({ beginn: toMin(t.von), ende: toMin(t.bis) }))
        for (const s of freieSlots(dauer, zeiten, belegt))
            alle.add(s)
    }
    // Zeitfenster
    const spaeteste = new Date()
    spaeteste.setMonth(spaeteste.getMonth() + 3)
    if (tag > spaeteste) return res.json([])
    const frueheste = Date.now() + 2 * 60 * 60 * 1000

    // Uhrzeiten ausgeben
    const slots = [...alle]
        .sort((a, b) => a - b)
        .filter(s => tag.getTime() + s * 60 * 1000 >= frueheste)
        .map(toHHMM)

    res.json(slots)


})
export default router
