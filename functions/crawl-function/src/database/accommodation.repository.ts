import { Accommodation } from '../models/accommodation.model'
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient()

export interface Config {
	tableName: string
	limit: number
}

export interface QueryCondition {
	dateList: string[]
	minPrice: number
	maxPrice: number
	district: string
}

export class AccommodationRepository {
	constructor(private readonly config: Config) {}

	async queryWithConditions(
		condition: QueryCondition,
	): Promise<Accommodation[]> {
		const {
			dateList,
			minPrice = 0,
			maxPrice = 1000000000,
			district = null,
		} = condition
		try {
			const results = await Promise.all(
				dateList.map(async (date) => {
					const command = new QueryCommand({
						TableName: this.config.tableName,
						KeyConditionExpression: 'publishedDate = :date',
						FilterExpression:
							'isLocationResolved = :isLocationResolved',
						ExpressionAttributeValues: {
							':date': { S: date },
							':isLocationResolved': { BOOL: true },
						},
						IndexName: 'publishedDate-price-index',
					})

					const response = await client.send(command)
					return response.Items
				}),
			).then((responseResults) => {
				return responseResults.flatMap((item) => item)
			})

			const accomList: Accommodation[] = results
				.filter((result) => result.isLocationResolved.BOOL === true)
				.map((item) => {
					const longitude = item.location.M.longitude.N
					const latitude = item.location.M.latitude.N
					return {
						id: item.id.S,
						source: item.source.S,
						propUrl: item.propUrl.S,
						propertyName: item.propertyName.S,
						price: parseInt(item.price.N),
						area: parseInt(item.area.N),
						numberOfBedRooms: parseInt(item.numberOfBedRooms.N),
						numberOfWCs: parseInt(item.numberOfWCs.N),
						publishedDate: item.publishedDate.S,
						isLocationResolved: item.isLocationResolved.BOOL,
						location: {
							longitude: parseFloat(longitude),
							latitude: parseFloat(latitude),
						},
						phoneNumber: item.phoneNumber.S,
						address: item.address.S,
						description: item.description.S,
					}
				})

			const filter = (item: Accommodation) => {
				let hasDistrict = true
				if (district) {
					hasDistrict = item.address.includes(district)
				}
				return (
					hasDistrict &&
					item.price >= minPrice &&
					item.price <= maxPrice
				)
			}
			return accomList.filter(filter)
		} catch (error) {
			console.error(error)
			throw error
		}
	}
}
