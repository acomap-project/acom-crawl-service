export class AccomNotFoundException extends Error {
	constructor(id: string) {
		super(`Accommodation with id ${id} not found`)
	}
}

export class SaveAccomFailedException extends Error {
	constructor(error?: Error) {
		super(error.message || 'Failed to save accommodation')
	}
}
