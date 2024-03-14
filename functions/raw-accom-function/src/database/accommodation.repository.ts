import { RawAccommodation } from '../models/accommodation.model'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
	PutItemCommand,
	PutItemCommandInput,
	GetItemCommand,
	GetItemCommandInput,
	DeleteItemCommand,
	DeleteItemCommandInput,
} from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient()

export interface Config {
	tableName: string
}

export class AccommodationRepository {
	constructor(private readonly config: Config) {}

	async save(accom: RawAccommodation) {
		const params: PutItemCommandInput = {
			TableName: this.config.tableName,
			Item: {
				_id: { S: accom._id },
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

	async findById(_id: string) {
		const params: GetItemCommandInput = {
			TableName: this.config.tableName,
			Key: {
				_id: { S: _id },
			},
		}

		try {
			const command = new GetItemCommand(params)
			const response = await client.send(command)
			const item = response.Item
			if (item) {
				const accommodation: RawAccommodation = {
					_id: item._id.S,
					id: item.id.S,
					propUrl: item.propUrl.S,
					propertyName: item.propertyName.S,
					price: parseInt(item.price.N),
					area: parseInt(item.area.N),
					numberOfBedRooms: parseInt(item.numberOfBedRooms.N),
					numberOfWCs: parseInt(item.numberOfWCs.N),
					publishedDate: item.publishedDate.S,
					phoneNumber: item.phoneNumber.S,
					address: item.address.S,
					description: item.description.S,
					source: item.source.S,
					createdAt: parseInt(item.createdAt.N),
					updatedAt: parseInt(item.updatedAt.N),
				}
				return accommodation
			} else {
				return null
			}
		} catch (error) {
			console.error('Error retrieving item:', error)
			throw error
		}
	}

	async delete(_id: string) {
		const params: DeleteItemCommandInput = {
			TableName: this.config.tableName,
			Key: {
				_id: { S: _id },
			},
		}

		try {
			const command = new DeleteItemCommand(params)
			await client.send(command)
			return true
		} catch (error) {
			console.error('Error deleting item:', error)
			throw error
		}
	}
}
