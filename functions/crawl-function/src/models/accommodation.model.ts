import { District } from '../constants'

export interface Coordination {
	longitude: number
	latitude: number
}

export interface LocationArea {
	city: string
	district: string
	city_code: string
	district_code: string
}

export interface Accommodation {
	id: string
	propUrl: string
	propertyName: string
	price: number
	area: number
	numberOfBedRooms: number
	numberOfWCs: number
	publishedDate: string
	location: Coordination
	isLocationResolved: boolean
	phoneNumber: string
	address: string
	description: string
	source: string
}
