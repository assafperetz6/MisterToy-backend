import { ObjectId } from 'mongodb' 

import { dbService } from '../../Services/db.service.js'
import { utilService } from '../../Services/util.service.js'
import { loggerService } from '../../Services/logger.service.js'

export const toyService = {
    query,
    getById,
    remove,
    add,
    update,
    addToyMsg,
    removeToyMsg
}

// const PAGE_SIZE = 5
// const toys = utilService.readJsonFile('data/toy.json')

async function query(filterBy = { txt: '' }) {
    try {
        const criteria = _buildCriteria(filterBy)

        const collection = await dbService.getCollection('toy')
        var toys = await collection.find(criteria).toArray()
        return toys
    } catch (err) {
        loggerService.error('cannot find toys', err)
        throw err
    }
}

async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        const toy = await collection.findOne({ _id: ObjectId.createFromHexString(toyId) })
        toy.createdAt = toy._id.getTimestamp()
        return toy
    } catch (err) {
        loggerService.error(`while finding toy ${toyId}`, err)
        throw err
    }
}

async function remove(toyId) {
	try {
		const collection = await dbService.getCollection('toy')
		const { deletedCount } = await collection.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
        return deletedCount
	} catch (err) {
		loggerService.error(`cannot remove toy ${toyId}`, err)
		throw err
	}
}

async function add(toy) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.insertOne(toy)
        return toy
    } catch (err) {
        loggerService.error('cannot insert toy')
        throw err
    }
}

async function update(toy) {
    try {
        const toyToSave = {
            name: toy.name,
            inStock: toy.inStock,
            price: toy.price
        }
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: ObjectId.createFromHexString(toy._id) }, { $set: toyToSave })
        return toy
    } catch (err) {
        loggerService.error('cannot update toy')
        throw err
    }
}

async function addToyMsg(toyId, msg) {
    try {
        msg.id = utilService.makeId()

        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        loggerService.error(`cannot add toy msg ${toyId}`, err)
		throw err
    }
}

async function removeToyMsg(toyId, msgId) {
	try {
		const collection = await dbService.getCollection('toy')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $pull: { msgs: { id: msgId }}})
		return msgId
	} catch (err) {
		logger.error(`cannot add toy msg ${toyId}`, err)
		throw err
	}
}

function _buildCriteria(filterBy) {
    const criteria = {}

    if (filterBy.txt) {
        criteria.name = { $regex: filterBy.txt, $options: 'i' }
    }
    if (filterBy.maxPrice) {
        criteria.price = { $lte: filterBy.maxPrice }
    }
    if (filterBy.inStock) {
        criteria.inStock = JSON.parse(filterBy.inStock)
    }
    if (filterBy.labels && filterBy.labels.length > 0) {
        criteria.labels = { $all: filterBy.labels }
    }

    return criteria
}