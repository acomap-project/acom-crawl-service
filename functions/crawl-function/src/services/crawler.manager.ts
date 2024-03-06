import {
	CrawlerConfiguration,
	ICrawlService,
} from '../interfaces/crawler.interfaces'
import { Accommodation } from 'src/models'

export class CrawlerManager implements ICrawlService {
	name = 'crawlermanager'
	private readonly crawlers: Map<string, ICrawlService> = new Map()

	addCrawler(crawler: ICrawlService): void {
		this.crawlers.has(crawler.name) ||
			this.crawlers.set(crawler.name, crawler)
	}

	getCrawler(name: string): ICrawlService {
		return this.crawlers.get(name)
	}

	async crawl(config: CrawlerConfiguration): Promise<Accommodation[]> {
		const result = await Promise.all(
			Array.from(this.crawlers.values()).map((crawler) =>
				crawler.crawl(config),
			),
		)
		const properties = result.reduce((pre, cur) => pre.concat(cur), [])

		return properties as Accommodation[]
	}
}
