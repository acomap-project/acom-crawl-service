// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({
	path: path.join(__dirname, '../.env'),
})

import path from 'path'
import express, { Request, Response } from 'express'
import { handler } from './lambda'

const app = express()

app.post('/crawl', async (req: Request, res: Response) => {
	try {
		const result = await handler(
			{
				city: 'Hồ Chí Minh',
				district: 'Quận 1',
				city_code: 'ho-chi-minh',
				district_code: 'quan-1',
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
