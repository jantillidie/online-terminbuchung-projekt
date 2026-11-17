import express from 'express'
import leistungenRouter from './src/routes/leistungen.js'
import mitarbeiterRouter from './src/routes/mitarbeiter.js'

const app = express()
app.use(express.json())
app.use(express.static('public'))

app.use('/api/leistungen', leistungenRouter)
app.use('/api/mitarbeiter', mitarbeiterRouter)


app.listen(process.env.PORT || 3000, () => console.log('läuft'))
