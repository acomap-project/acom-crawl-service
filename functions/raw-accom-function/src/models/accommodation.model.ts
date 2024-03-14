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

export interface RawAccommodation {
	_id?: string
	id: string
	source: string
	propUrl: string
	propertyName: string
	price: number
	area: number
	numberOfBedRooms: number
	numberOfWCs: number
	publishedDate: string
	phoneNumber: string
	address: string
	description: string
	location?: Coordination
	isLocationResolved?: boolean
	createdAt?: number
	updatedAt?: number
}
