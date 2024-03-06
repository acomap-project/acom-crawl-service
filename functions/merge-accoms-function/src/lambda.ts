export interface FunctionEvent {
	results: {
		item_list: any[]
	}[]
}

export interface FunctionResult {
	item_list: any[]
}

export const handler = async (event: FunctionEvent) => {
	const { results } = event

	const accomList = results.reduce((pre, cur) => {
		const accomListOfArea = cur.item_list
		pre.push(...accomListOfArea)
		return pre
	}, [] as any[])

	return {
		item_list: accomList,
	}
}
