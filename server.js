import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app = express()

app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174'
    ],
    credentials: true,
}
app.use(cors(corsOptions))

app.get('/api/toy', (req, res) => {
    
})