import {
	CrawlerConfiguration,
	ICrawlService,
} from '../interfaces/crawler.interfaces'

export class CrawlController {
	constructor(private readonly crawlService: ICrawlService) {}

	async crawl(config: CrawlerConfiguration) {
		const result = await this.crawlService.crawl(config)
		return result
	}
}
