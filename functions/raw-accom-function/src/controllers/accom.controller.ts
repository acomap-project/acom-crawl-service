import { v4 as uuidv4 } from 'uuid'
import { RawAccommodation } from 'src/models'
import { SaveAccomDTO } from './dtos/save-accom.dtos'
import { AccommodationRepository } from 'src/database'
import { ResolveAccomDTO } from './dtos/resolve-accom.dtos'
import { AccomNotFoundException, SaveAccomFailedException } from '../errors'
import { AccommodationService } from '../services/accommodation.service'

export class AccomController {
	constructor(
		private readonly repo: AccommodationRepository,
		private readonly accomService: AccommodationService,
	) {}

	async saveAccom(dto: SaveAccomDTO): Promise<RawAccommodation> {
		const { accom } = dto
		accom._id = uuidv4()
		const updatedAccom = await this.repo.save(dto.accom)
		return updatedAccom
	}

	async resolveAccom(dto: ResolveAccomDTO) {
		const { _id, location } = dto
		const accom = await this.repo.findById(_id)

		if (!accom) {
			console.log(`Accommodation with id ${_id} not found`)
			throw new AccomNotFoundException(_id)
		}

		accom.location = location

		try {
			await this.accomService.saveAccom(accom)
			console.log(`Accommodation with id ${_id} resolved`)
			await this.repo.delete(_id)
			console.log(`Accommodation with id ${_id} deleted`)
		} catch (error) {
			console.error(error)
			throw new SaveAccomFailedException(error)
		}
	}
}
