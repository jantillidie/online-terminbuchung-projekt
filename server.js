import express from 'express'
import leistungenRouter from './src/routes/leistungen.js'
import mitarbeiterRouter from './src/routes/mitarbeiter.js'
import slotsRouter from './src/routes/slots.js'
import termineRouter from './src/routes/termine.js'

const app = express()
app.use(express.json())
app.use(express.static('public'))

app.use('/api/leistungen', leistungenRouter)
app.use('/api/mitarbeiter', mitarbeiterRouter)
app.use('/api/slots', slotsRouter)
app.use('/api/termine', termineRouter)

app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ fehler: 'Serverfehler' })
})

app.listen(process.env.PORT || 3000, () => console.log('läuft'))
