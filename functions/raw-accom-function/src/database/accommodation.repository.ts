import { Accommodation } from '../models/accommodation.model'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient()

export interface Config {
	tableName: string
}

export class AccommodationRepository {
	constructor(private readonly config: Config) {}

	async save(accom: Accommodation) {
		const params: PutItemCommandInput = {
			TableName: this.config.tableName,
			Item: {
				id: { S: accom.id },
				propUrl: { S: accom.propUrl },
				propertyName: { S: accom.propertyName },
				price: { N: accom.price.toString() },
				area: { N: accom.area.toString() },
				numberOfBedRooms: { N: accom.numberOfBedRooms.toString() },
				numberOfWCs: { N: accom.numberOfWCs.toString() },
				publishedDate: { S: accom.publishedDate },
				phoneNumber: { S: accom.phoneNumber },
				address: { S: accom.address },
				description: { S: accom.description },
				source: { S: accom.source },
				createdAt: { N: Date.now().toString() },
				updatedAt: { N: Date.now().toString() },
			},
		}

		try {
			const command = new PutItemCommand(params)
			await client.send(command)
			return accom
		} catch (error) {
			console.error('Error saving item:', error)
			throw error
		}
	}
}
