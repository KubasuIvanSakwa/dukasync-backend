import express from 'express'
import connectToDatabse from "./database/mongodb.js";

import { PORT } from './config/env.js'
import app from './app.js'

app.get('/', (req, res) => {
    res.send(`
        <html style="background: #000; color: #fff;">
            Eccormerce Database API
        </html>
        `)
})

app.listen(PORT, async () => {
    console.log(`Served on PORT http://localhost:${PORT}`)

    await connectToDatabse()
})