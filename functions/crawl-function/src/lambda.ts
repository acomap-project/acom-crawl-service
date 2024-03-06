import { CrawlController } from './controllers'
import { Accommodation, LocationArea } from './models'
import { CrawlerManager, MogiCrawler, PhongTro123Crawler } from './services'

export type CrawlFunctionEvent = LocationArea
export interface CrawFunctionResult {
	items: Accommodation[]
}

let controller: CrawlController
let isInit = false

const init = () => {
	if (isInit) {
		return
	}
	const crawlerManager = new CrawlerManager()
	// crawlerManager.addCrawler(new MogiCrawler())
	crawlerManager.addCrawler(new PhongTro123Crawler())

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
		items: accomList,
	}
}
