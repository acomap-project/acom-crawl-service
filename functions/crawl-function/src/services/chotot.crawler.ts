import axios from 'axios'
import AREA_MAPPING from '../../config/chotot-area-mapping.json'
import {
	CrawlerConfiguration,
	ICrawlService,
} from '../interfaces/crawler.interfaces'
import moment from 'moment'
import { Accommodation, LocationArea } from '../models/accommodation.model'

export class ChototCrawler implements ICrawlService {
	name = 'chotot'
	private readonly SEARCH_BASE_URL =
		'https://gateway.chotot.com/v1/public/ad-listing'
	private readonly BASE_PROP_URL = 'https://www.chotot.com'
	private readonly PAGE_SIZE = 10
	private readonly MAX_CRAWL_SIZE = 50

	async crawl(config: CrawlerConfiguration) {
		try {
			const queryUrl = this.getQueryUrl(config)
			let page = 1
			const accomList = []
			let pagedPropertyList = []
			do {
				pagedPropertyList.length = 0
				pagedPropertyList = await this.getPropertyListForPage(
					queryUrl,
					page,
					this.PAGE_SIZE,
				)
				accomList.push(...pagedPropertyList)
				page++
			} while (
				pagedPropertyList.length === this.PAGE_SIZE &&
				accomList.length <= this.MAX_CRAWL_SIZE
			)
			return this.applyAdditionalFilters(config, accomList)
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	protected async getPropertyListForPage(
		url: string,
		page: number,
		pageSize: number = this.PAGE_SIZE,
	): Promise<Accommodation[]> {
		const pageUrl = new URL(url)
		pageUrl.searchParams.append('page', page.toString())
		pageUrl.searchParams.append('limit', pageSize.toString())
		const response = await axios.get(pageUrl.toString())

		if (response.status !== 200) {
			console.error('Failed to fetch page', pageUrl.toString())
			return []
		}
		const rawAccomList = response.data.ads
		return rawAccomList.map((rawAccom) => {
			return {
				id: rawAccom.list_id,
				source: this.name,
				propertyName: rawAccom.subject,
				address: [
					rawAccom.address,
					rawAccom.ward_name,
					rawAccom.area_name,
					rawAccom.region_name,
				]
					.filter(Boolean)
					.join(', ')
					.trim(),
				description: rawAccom.body,
				area: rawAccom.size,
				location: {
					latitude: rawAccom.latitude,
					longitude: rawAccom.longitude,
				},
				isLocationResolved: true,
				numberOfBedRooms: -1,
				numberOfWCs: -1,
				phoneNumber: '',
				price: rawAccom.price,
				propUrl: `${this.BASE_PROP_URL}/${rawAccom.list_id}.htm`,
				publishedDate: moment(rawAccom.list_time).format('DD/MM/YYYY'),
			} as Accommodation
		})
	}

	protected getQueryUrl(config: CrawlerConfiguration) {
		const { area, maxPrice, minPrice } = config
		const { city, district } = this.getAreaUrlParam(area)
		const url = new URL(
			`${this.SEARCH_BASE_URL}?region_v2=${city}&area_v2=${district}`, //
		)
		url.searchParams.append('cg', '1050') // `cg` is the category code for 'Phòng trọ'
		url.searchParams.append('sp', '0') // `sp` is the sort order code. 0 means latest first

		const minPriceParam = minPrice ? minPrice * 1000000 : '*'
		const maxPriceParam = maxPrice ? maxPrice * 1000000 : '*'
		url.searchParams.append('price', `${minPriceParam}-${maxPriceParam}`)

		console.log(`Query for ${city} - ${district}: ` + url.toString())

		return url.toString()
	}

	private getAreaUrlParam(area: LocationArea) {
		const { city_code, district_code } = area

		const city = AREA_MAPPING.city_mapping_code[city_code]
		const district =
			AREA_MAPPING.district_mapping_code[city_code][district_code]

		if (!city || !district) {
			throw new Error('Invalid area code')
		}

		return {
			city,
			district,
		}
	}

	private applyAdditionalFilters(
		config: CrawlerConfiguration,
		properties: Accommodation[],
	) {
		const publishedDateFilter =
			(lastPublishedDateRange: number) => (p: Accommodation) => {
				const publishedDate = moment(p.publishedDate, 'DD/MM/YYYY')
				const today = moment(Date.now())
				return (
					today.diff(publishedDate, 'days') <= lastPublishedDateRange
				)
			}
		return properties.filter(
			publishedDateFilter(config.lastPublishedDateRange),
		)
	}
}
