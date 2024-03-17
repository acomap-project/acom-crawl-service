import { CrawlController } from './controllers'
import { Accommodation, LocationArea } from './models'
import {
	ChototCrawler,
	CrawlerManager,
	MogiCrawler,
	PhongTro123Crawler,
} from './services'

export type CrawlFunctionEvent = LocationArea
export interface CrawFunctionResult {
	item_list: Accommodation[]
}

let controller: CrawlController
let isInit = false

const init = () => {
	if (isInit) {
		return
	}
	const crawlerManager = new CrawlerManager()

	const crawlerList = new Set(process.env.CRAWLER_LIST.split(','))
	crawlerList.forEach((crawler) => {
		switch (crawler) {
			case 'mogi':
				crawlerManager.addCrawler(new MogiCrawler())
				break
			case 'phongtro123':
				crawlerManager.addCrawler(new PhongTro123Crawler())
				break
			case 'chotot':
				crawlerManager.addCrawler(new ChototCrawler())
				break
		}
	})

	controller = new CrawlController(crawlerManager)
	isInit = true
}

export const handler = async (
	event: CrawlFunctionEvent,
	context: any,
): Promise<CrawFunctionResult> => {
	init()
	const accomList = await controller.crawl({
		area: event,
		lastPublishedDateRange: 1,
	})

	return {
		item_list: accomList.map((accom) => ({
			...accom,
			cityCode: event.city_code,
			areaCode: event.area_code,
		})),
	}
}
