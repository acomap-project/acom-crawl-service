// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({
	path: path.join(__dirname, '../.env'),
})

import path from 'path'
import express, { Request, Response } from 'express'
import { handler } from './lambda'

const app = express()

app.use(express.json())

app.post('/raw-accoms', async (req: Request, res: Response) => {
	try {
		const result = await handler(
			{
				type: 'step-function',
				accom: req.body,
			},
			{},
		)

		res.status(200).json(result)
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: JSON.stringify(error),
		})
	}
})

app.patch('/raw-accoms/:id', async (req: Request, res: Response) => {
	const { id } = req.params
	try {
		const result = await handler(
			{
				type: 'api-gateway',
				method: 'resolve-accom',
				body: {
					...req.body,
					_id: id,
				},
			},
			{},
		)

		res.status(200).json(result)
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: JSON.stringify(error),
		})
	}
})

app.listen(3000, () => {
	console.log('Listening on port 3000')
})
