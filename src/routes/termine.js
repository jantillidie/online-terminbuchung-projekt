import { Router } from 'express'
import crypto from 'node:crypto'
import { pool } from '../db.js'
import { freieSlots } from '../regeln.js'
import { toMin, toHHMM, pruefeRegeln } from '../regeln.js'

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

    const tag = new Date(datum + 'T00:00:00')
    if (isNaN(tag) || tag.getDate() !== Number(datum.slice(8, 10))) {
        return res.status(400).json({ fehler: 'Ungültiges Datum.' })
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

    const [leistungen] = await pool.execute(
        'select id, dauer_min, preis from leistung where id = ? and aktiv = 1', [leistungId]
    )
    if (leistungen.length === 0) {
        return res.status(404).json({ fehler: 'Leistung nicht gefunden.' })
    }
    const leistung = leistungen[0]

    const regelFehler = pruefeRegeln(datum, uhrzeit, leistung.dauer_min, new Date())
    if (regelFehler) return res.status(400).json({ fehler: regelFehler })

    const [koennen] = await pool.execute(
        `select m.id from mitarbeiter m
         join mitarbeiter_leistung ml on ml.mitarbeiter_id = m.id
         where ml.leistung_id = ? and m.aktiv = 1`, [leistungId]
    )
    let kandidaten = koennen.map(m => m.id)
    if (!egal) {
        if (!kandidaten.includes(maId)) {
            return res.status(400).json({ fehler: 'Diese Person bietet die Leistung nicht an.' })
        }
        kandidaten = [maId]
    }
    if (kandidaten.length === 0) {
        return res.status(400).json({ fehler: 'Niemand bietet diese Leistung an.' })
    }

    const beginn = `${datum} ${uhrzeit}:00`
    const ende = `${datum} ${toHHMM(toMin(uhrzeit) + leistung.dauer_min)}:00`

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // Kandidaten sperren: parallele Buchungen warten hier
        const [personen] = await conn.query(
            'select id, name from mitarbeiter where id in (?) order by id for update', [kandidaten]
        )

        // Bei "egal": wenigste Termine an dem Tag zuerst
        const [anzahl] = await conn.query(
            `select mitarbeiter_id, count(*) as n from termin
             where date(beginn) = ? and status <> 'storniert' and mitarbeiter_id in (?)
             group by mitarbeiter_id`, [datum, kandidaten]
        )
        const last = id => anzahl.find(a => a.mitarbeiter_id === id)?.n ?? 0
        personen.sort((a, b) => last(a.id) - last(b.id))

        // Erste freie Person nehmen
        let gewaehlt = null
        for (const p of personen) {
            const [kollision] = await conn.query(
                `select id from termin
                 where mitarbeiter_id = ? and status <> 'storniert' and beginn < ? and ende > ?`,
                [p.id, ende, beginn]
            )
            if (kollision.length === 0) { gewaehlt = p; break }
        }
        if (!gewaehlt) {
            await conn.rollback()
            return res.status(409).json({ fehler: 'Diese Zeit ist leider nicht mehr frei.' })
        }

        // Kunde anlegen oder aktualisieren
        const [kunde] = await conn.query(
            `insert into kunde (name, telefon, email) values (?, ?, ?)
             on duplicate key update name = values(name), telefon = values(telefon), id = last_insert_id(id)`,
            [name, telefon, email]
        )

        const stornoCode = crypto.randomUUID()
        await conn.query(
            `insert into termin (kunde_id, mitarbeiter_id, leistung_id, beginn, ende, preis, storno_code)
             values (?, ?, ?, ?, ?, ?, ?)`,
            [kunde.insertId, gewaehlt.id, leistung.id, beginn, ende, leistung.preis, stornoCode]
        )

        await conn.commit()
        console.log('Bestätigung an', email, '|', beginn, '|', gewaehlt.name, '| Code', stornoCode)
        res.status(201).json({ storno_code: stornoCode, beginn, mitarbeiter: gewaehlt.name })
    } catch (e) {
        await conn.rollback()
        throw e
    } finally {
        conn.release()
    }
})

export default router