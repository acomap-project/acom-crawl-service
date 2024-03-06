import { Coordination } from '../models/accommodation.model'
import axios from 'axios' // Import the axios package

export interface MapboxConfig {
	accessToken: string
}

export class MapboxService {
	constructor(private readonly config: MapboxConfig) {}

	async getCoordination(address: string): Promise<Coordination> {
		try {
			// implement the logic to get the coordinates from the address using mapbox geocoding API
			const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${this.config.accessToken}`
			const response = await axios.get(url) // Use axios to make the HTTP request
			const [longitude, latitude] = response.data.features[0].center
			return { longitude, latitude }
		} catch (error) {
			// Handle any potential errors here
			console.error('Error getting coordinates:', error)
			throw error
		}
	}
}
