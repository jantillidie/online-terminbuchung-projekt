export function toMin(t) {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
}

export function toHHMM(min) {
    const hour = String(Math.floor(min / 60)).padStart(2, '0')
    const minutes = String(min % 60).padStart(2, '0')
    return `${hour}:${minutes}`
}

// Wochentag: getDay: 0 = So bis 6 = Sa > auf, zu = in Minuten, fehlender Tag = closed
export const OEFFNUNG = {
    2: [540, 1080],
    3: [540, 1080],
    4: [540, 1080],
    5: [540, 1080],
    6: [540, 840]
}

// belegt: [{ beginn, ende }] in Minuten seit Mitternacht
export function freieSlots(dauer, [auf, zu], belegt) {
    const slots = []

    for (let slotBeginn = auf; slotBeginn + dauer <= zu; slotBeginn += 15) {
        const slotEnde = slotBeginn + dauer
        const kollidiert = belegt.some(termin => slotBeginn < termin.ende && slotEnde > termin.beginn)
        if (!kollidiert) slots.push(slotBeginn)
    }

    return slots
}

export function pruefeRegeln(datum, uhrzeit, dauer, jetzt) {
    const minuten = Number(uhrzeit.slice(3, 5))
    if (![0, 15, 30, 45].includes(minuten)) {
        return 'Termine beginnen nur zur vollen Viertelstunde.'
    }

    const tag = new Date(datum + 'T00:00:00')
    const zeiten = OEFFNUNG[tag.getDay()]
    if (!zeiten) {
        return 'An diesem Tag ist der Salon geschlossen.'
    }

    const [auf, zu] = zeiten
    const beginnMin = toMin(uhrzeit)
    if (beginnMin < auf || beginnMin + dauer > zu) {
        return 'Der Termin liegt außerhalb der Öffnungszeiten.'
    }

    const beginn = new Date(datum + 'T' + uhrzeit + ':00')
    if (beginn.getTime() < jetzt.getTime() + 2 * 60 * 60 * 1000) {
        return 'Termine bitte mindestens 2 Stunden im Voraus buchen.'
    }
    const spaeteste = new Date(jetzt)
    spaeteste.setMonth(spaeteste.getMonth() + 3)
    if (beginn > spaeteste) {
        return 'Termine können höchstens 3 Monate im Voraus gebucht werden.'
    }

    return null
}