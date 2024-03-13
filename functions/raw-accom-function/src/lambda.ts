import { AccomController } from './controllers/accom.controller'
import { AccommodationRepository } from './database'
import { Accommodation } from './models'

export interface FunctionEvent {
	accom: Accommodation
}

export interface FunctionResult {
	result: string
	data?: Accommodation
}

let controller: AccomController
let isInit = false

const init = () => {
	if (isInit) {
		return
	}
	const repo = new AccommodationRepository({
		tableName: process.env.RAW_ACCOMMODATION_TABLE_NAME,
	})
	controller = new AccomController(repo)
	isInit = true
}

export const handler = async (
	event: FunctionEvent,
	context: any,
): Promise<FunctionResult> => {
	init()
	const { accom } = event
	const updatedAccom = await controller.saveAccom({
		accom,
	})

	return {
		result: 'SUCCESS',
		data: updatedAccom,
	}
}
