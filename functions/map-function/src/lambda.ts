import { Accommodation } from './models/accommodation.model'
import { MapboxService } from './services/mapbox.service'

export interface FunctionEvent {
	item_list: Accommodation[]
}

export interface FunctionResult {
	item_list: Accommodation[]
}

let isInit = false
let mapboxService: MapboxService

const init = () => {
	if (isInit) {
		return
	}

	mapboxService = new MapboxService({
		accessToken: process.env.MAPBOX_ACCESS_TOKEN,
	})

	isInit = true
}

export const handler = async (event: FunctionEvent) => {
	console.log('Start to resolve location for accommodations')
	init()

	const { item_list } = event

	const nonLocationResolvedAccomList = item_list.filter(
		(accom) => !accom.isLocationResolved,
	)

	const batchSize = 20
	for (let i = 0; i < nonLocationResolvedAccomList.length; i += batchSize) {
		const batch = nonLocationResolvedAccomList.slice(i, i + batchSize)
		await Promise.all(
			batch.map(async (accom) => {
				try {
					const result = await mapboxService.getCoordination(
						accom.address,
					)
					accom.location = result
					accom.isLocationResolved = true
				} catch (error) {
					console.error(error)
					console.log(`Unable to get coordination for ${accom.id}`)
				}
			}),
		)
	}

	console.log(
		`Resolved location for ${nonLocationResolvedAccomList.length} accommodations`,
	)

	return {
		item_list,
	}
}
