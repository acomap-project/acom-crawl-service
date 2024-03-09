// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({
	path: path.join(__dirname, '../.env'),
})

import path from 'path'
import express, { Request, Response } from 'express'
import { handler } from './lambda'

const app = express()

app.use(express.json())

app.post('/crawl', async (req: Request, res: Response) => {
	try {
		const result = await handler(req.body as any, {})

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
