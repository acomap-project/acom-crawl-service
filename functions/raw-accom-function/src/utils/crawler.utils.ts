export const parseArea = (value: string, unit = 'm2') => {
	const unitIndex = value.indexOf(unit)
	return unitIndex === -1
		? parseInt(value)
		: parseInt(value.slice(0, unitIndex))
}

export const parsePublishedDateFromRange = (value: string) => {
	return new Date().getTime()
}

export const parsePrice = (price: string): number => {
	const isNumber = (v: string) => !Number.isNaN(parseInt(v))
	const priceParts = price.split(' ').filter(isNumber).map(parseFloat)
	if (priceParts.length === 1) {
		return priceParts[0]
	}
	return priceParts[0] + priceParts[1] / 1000
}
