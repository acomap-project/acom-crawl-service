import { AccomController } from './controllers/accom.controller'
import { ResolveAccomDTO } from './controllers/dtos/resolve-accom.dtos'
import { AccommodationRepository } from './database'
import { RawAccommodation } from './models'
import { AccommodationService } from './services/accommodation.service'

export interface StepFunctionEvent {
	type: 'step-function'
	accom: RawAccommodation
}

export interface StepFunctionResult {
	result: string
}

export interface APIGatewayEvent {
	type: 'api-gateway'
	method: string

	[key: string]: any
}

export interface APIGatewayResult {
	result: string
	data?: any
	error?: any
}

export interface ResolveAccomFunctionEvent extends APIGatewayEvent {
	method: 'resolve-accom'
	body: ResolveAccomDTO
}

export type FunctionEvent = StepFunctionEvent | APIGatewayEvent
export type FunctionResult = StepFunctionResult | APIGatewayResult

let controller: AccomController
let isInit = false

const init = () => {
	console.log('Start init function')
	if (isInit) {
		return
	}

	const repo = new AccommodationRepository({
		tableName: process.env.RAW_ACCOMMODATION_TABLE_NAME,
		expiryDurationInDays: 10,
	})
	const accomService = new AccommodationService({
		queueUrl: process.env.ACCOMMODATION_SERVICE_SQS_QUEUE_URL,
	})
	controller = new AccomController(repo, accomService)

	isInit = true

	console.log('End init function')
}

export const handler = async (
	event: FunctionEvent,
	context: any,
): Promise<FunctionResult> => {
	init()
	console.log(event)

	switch (event.type) {
		case 'step-function':
			return handleStepFunctionEvent(event)
		case 'api-gateway':
			return handleAPIGatewayEvent(event)
	}

	throw new Error('Invalid event type')
}

async function handleStepFunctionEvent(
	event: StepFunctionEvent,
): Promise<StepFunctionResult> {
	const { accom } = event
	await controller.saveAccom({
		accom,
	})

	return {
		result: 'SUCCESS',
	}
}

async function handleAPIGatewayEvent(
	event: APIGatewayEvent,
): Promise<APIGatewayResult> {
	if (event.method === 'resolve-accom') {
		console.log('Handle resolve-accom')
		try {
			await controller.resolveAccom(event.body)
			console.log('Resolve accom success')
			return {
				result: 'SUCCESS',
				data: null,
			}
		} catch (error) {
			return {
				result: 'FAILED',
				error: error.message,
			}
		}
	}

	return {
		result: 'FAILED',
		error: 'Invalid method',
	}
}
