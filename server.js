import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { toyService } from './Services/toy.service.js'
import { userService } from './Services/user.service.js'
import { loggerService } from './Services/logger.service.js'


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

// TOY API

app.get('/api/toy', async (req, res) => {
    const filterBy = {
        txt: req.query.txt || '',
        isStock: req.query.isStock || undefined,
        maxPrice: +req.query.maxPrice || 0,
        pageIdx: req.query.pageIdx || undefined
    }
    console.log('filter by stock:', filterBy.isStock)
    
    try {
        const toys = await toyService.query(filterBy)
        console.log(toys)
        return res.send(toys)
    } catch (err) {
        loggerService.error('Cannot get toys', err)
        res.status(400).send('Cannot get toys')
    }
})

app.get('/api/toy/:toyId', async (req, res) => {
    const { toyId } = req.params

    try {
        const toy = await toyService.getById(toyId)
        return res.send(toy)
    } catch (err) {
        loggerService.error('Cannot get toy', err)
        res.status(400).send('Cannot get toy')
    }
})

app.post('/api/toy', async (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot add toy')

    const toy = {
        name: req.body.name,
        price: +req.body.price,
        inStock: req.body.inStock,
    }

    try {
        const savedToy = await toyService.save(toy, loggedinUser)
        return res.send(savedToy)
    } catch (err) {
        loggerService.error('Cannot save toy', err)
        res.status(400).send('Cannot save toy')
    }
})

app.put('/api/toy/:id', async (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot update toy')

    const toy = {
        _id: req.body._id,
        name: req.body.name,
        price: +req.body.price,
        inStock: req.body.inStock,
    }
    
    try {
        await toyService.save(toy, loggedinUser)
        return res.send(savedToy)
    } catch (err) {
        loggerService.error('Cannot save toy', err)
        res.status(400).send('Cannot save toy')
    }
})

app.delete('/api/toy/:toyId', async (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot remove toy')

    const { toyId } = req.params

    try {
        await toyService.remove(toyId, loggedinUser)   
        return res.send('Removed!') 
    } catch (err) {
        loggerService.error('Cannot remove toy', err)
        res.status(400).send('Cannot remove toy')
    }
})

// USER API

app.get('/api/user', async (req, res) => {
    try {
        const users = await userService.query()
        return res.send(users)
    } catch (err) {
        loggerService.error('Cannot load users', err)
        res.status(400).send('Cannot load users')
    }
})

app.get('/api/user/:userId', async (req, res) => {
    const { userId } = req.params

    try {
        const user = await userService.getById(userId)
        return res.send(user)
    } catch (err) {
        loggerService.error('Cannot load user', err)
        res.status(400).send('Cannot load user')
    }
})

// Auth API
app.post('/api/auth/login', async (req, res) => {
    const credentials = req.body

    try {
        const user = await userService.checkLogin(credentials)
        const loginToken = userService.getLoginToken(user)

        res.cookie('loginToken', loginToken)
        return res.send(user)
    } catch (err) {
        res.status(401).send('Invalid Credentials')
    }
})

app.post('/api/auth/signup', async (req, res) => {
    const credentials = req.body

    try {
        const user = await userService.save(credentials)
        const loginToken = userService.getLoginToken(user)
        
        res.cookie('loginToken', loginToken)
        return res.send(user)
    } catch (err) {
        res.status(400).send('Cannot signup')
    }
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out!')
})


app.put('/api/user', async (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(400).send('No logged in user')
    const { diff } = req.body
    if (loggedinUser.score + diff < 0) return res.status(400).send('No credit')
    loggedinUser.score += diff

    try {
        const user = await userService.save(loggedinUser)
        const token = userService.getLoginToken(user)
        res.cookie('loginToken', token)
        res.send(user)
    } catch (err) {
        loggerService('Problem updating user info', err)
        throw new Error('Problem updating user info')
    }
})


// Fallback route
app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

const PORT = process.env.PORT || 3030
app.listen(PORT, () =>
    loggerService.info(`Server listening on port http://127.0.0.1:${PORT}/`)
)
