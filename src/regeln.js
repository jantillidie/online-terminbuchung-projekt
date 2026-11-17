export function toMin(t) {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
}

export function toHHMM(min) {
    const hour = String(Math.floor(min / 60)).padStart(2, '0')
    const minutes = String(min % 60).padStart(2, '0')
    return `${hour}:${minutes}`
}