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