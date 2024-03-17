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
	cityCode: string
	areaCode: string
	propUrl: string
	propertyName: string
	price: number
	publishedDate: string
	address: string
	location?: Coordination
	createdAt?: number
	updatedAt?: number
}
