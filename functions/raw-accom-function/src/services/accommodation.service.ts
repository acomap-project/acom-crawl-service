import { RawAccommodation } from 'src/models'
import { SQS } from '@aws-sdk/client-sqs'

export interface AccommodationServiceConfig {
	queueUrl: string
}

export class AccommodationService {
	constructor(private readonly config: AccommodationServiceConfig) {}
	async saveAccom(accom: RawAccommodation): Promise<void> {
		const { _id, ...excludeIdAccom } = accom
		const sqs = new SQS({
			region: 'ap-southeast-1',
		})

		const params = {
			MessageBody: JSON.stringify(excludeIdAccom),
			QueueUrl: this.config.queueUrl,
		}

		try {
			const result = await sqs.sendMessage(params)
			if (!result.MessageId) {
				console.error(result)
				throw new Error('Failed to push accommodation data to SQS')
			}
			console.log(
				`Accommodation data pushed to SQS successfully. Message ID: ${result.MessageId}`,
			)
		} catch (error) {
			console.error('Error pushing accommodation data to SQS:', error)
			throw error
		}
	}
}
