export interface Coordination {
	longitude: number
	latitude: number
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

const mockAccommodation: Accommodation = {
	id: '123456',
	propUrl: 'https://example.com',
	propertyName: 'Example Property',
	price: 1000,
	area: 100,
	numberOfBedRooms: 2,
	numberOfWCs: 1,
	publishedDate: '2022-01-01',
	location: {
		longitude: 123.456,
		latitude: 78.9,
	},
	isLocationResolved: true,
	phoneNumber: '123-456-7890',
	address: '123 Main St, City, State',
	description: 'This is an example property',
	source: 'Example Source',
}
