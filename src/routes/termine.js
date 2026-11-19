import { Router } from 'express'
import { pool } from '../db.js'
import { freieSlots } from '../regeln.js'

const router = Router()

const text = v => (typeof v === 'string' ? v.trim() : '')

router.post('/', async (req, res) => {
    const leistungId = Number(req.body.leistung_id)
    const maParam = req.body.mitarbeiter_id
    const egal = maParam === 'egal'
    const maId = Number(maParam)
    const datum = text(req.body.datum)
    const uhrzeit = text(req.body.uhrzeit)
    const name = text(req.body.name)
    const telefon = text(req.body.telefon)
    const email = text(req.body.email)

    if (!Number.isInteger(leistungId) || leistungId < 1) {
        return res.status(400).json({ fehler: 'Bitte eine Leistung wählen. ' })
    }
    if (!egal && (!Number.isInteger(maId) || maId < 1)) {
        return res.status(400).json({ fehler: 'Bitte eine Person oder "egal" wählen.' })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
        return res.status(400).json({ fehler: 'Datum im Format JJJJ-MM-TT angeben.' })
    }
    if (!/^\d{2}:\d{2}$/.test(uhrzeit)) {
        return res.status(400).json({ fehler: 'Uhrzeit im Format HH:MM angeben.' })
    }
    if (name === '') {
        return res.status(400).json({ fehler: 'Bitte einen Namen angeben.' })
    }
    if (telefon.length < 5) {
        return res.status(400).json({ fehler: 'Telefonnummer ist zu kurz.' })
    }
    if (!email.includes('@')) {
        return res.status(400).json({ fehler: 'Bitte eine gültige E-Mail angeben.' })
    }

    res.json({ ok: true, leistungId, egal, maId, datum, uhrzeit, name })
})

export default router