import { Accommodation } from 'src/models'
import { SaveAccomDTO } from './dtos/save-accom.dtos'
import { AccommodationRepository } from 'src/database'

export class AccomController {
	constructor(private readonly repo: AccommodationRepository) {}

	async saveAccom(dto: SaveAccomDTO): Promise<Accommodation> {
		const updatedAccom = await this.repo.save(dto.accom)
		return updatedAccom
	}
}
