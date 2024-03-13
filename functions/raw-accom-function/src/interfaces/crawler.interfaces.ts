import { Accommodation, LocationArea } from '../models'

export interface CrawlerConfiguration {
	area: LocationArea
	minPrice?: number
	maxPrice?: number
	lastPublishedDateRange?: number
}

export interface ICrawlQueryTree {
	build(): any
}

export interface ICrawlService {
	name: string
	crawl(config: CrawlerConfiguration): Promise<Accommodation[]>
}

export interface CrawlerModuleForRootOptions {
	crawlers: string[]
}
