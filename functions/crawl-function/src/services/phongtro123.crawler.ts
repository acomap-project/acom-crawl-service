import * as cheerio from 'cheerio'
import axios from 'axios'
import AREA_MAPPING from '../../config/phongtro123-area-mapping.json'
import {
	CrawlerConfiguration,
	ICrawlService,
} from '../interfaces/crawler.interfaces'
import moment from 'moment'
import { parseArea } from '../utils/crawler.utils'
import { Accommodation, Coordination, LocationArea } from 'src/models'

export class PhongTro123Crawler implements ICrawlService {
	name = 'phongtro123'
	private readonly SEARCH_BASE_URL = 'https://phongtro123.com/tinh-thanh'
	private readonly BASE_URL = 'https://phongtro123.com'
	private readonly PAGE_SIZE = 10
	private readonly MAX_CRAWL_SIZE = 100

	async crawl(config: CrawlerConfiguration) {
		try {
			const queryUrl = this.getQueryUrl(config)
			let page = 1
			const accomList = []
			let pagedPropertList = []
			do {
				pagedPropertList.length = 0
				pagedPropertList = await this.getPropertyListForPage(
					queryUrl,
					page,
				)
				accomList.push(...pagedPropertList)
				page++
			} while (
				pagedPropertList.length === this.PAGE_SIZE &&
				accomList.length <= this.MAX_CRAWL_SIZE
			)
			return this.applyAdditionalFilters(config, accomList)
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	async getHtml(page: number) {
		const pageUrl = new URL(this.SEARCH_BASE_URL)
		pageUrl.searchParams.append('page', page.toString())
		const response = await axios.get(pageUrl.toString())
		const $ = cheerio.load(response.data)
		const propUrls = this.getAllPropertyUrls($)
		const property = await this.getPropertyDetail(propUrls[0])
		return property
	}

	protected async getPropertyListForPage(url: string, page: number) {
		const pageUrl = new URL(url)
		pageUrl.searchParams.append('page', page.toString())
		const response = await axios.get(pageUrl.toString())
		const $ = cheerio.load(response.data)
		const propUrls = this.getAllPropertyUrls($)
		const properties = await Promise.all(
			propUrls.map(async (propUrl) => {
				const prop = await this.getPropertyDetail(propUrl)
				return prop
			}),
		)
		return properties
	}

	protected getAllPropertyUrls(
		$: cheerio.CheerioAPI,
		maxLength = this.MAX_CRAWL_SIZE,
	): string[] {
		const propUrls = []
		$('.section-post-listing > ul.post-listing > li.post-item').each(
			(index, propHtml) => {
				if (index >= maxLength) {
					return
				}
				const $prop = $(propHtml)
				const propUrl = $prop.find('.post-title a').attr('href')
				propUrls.push(propUrl)
			},
		)
		return propUrls.map((propUrl) => `${this.BASE_URL}${propUrl}`)
	}

	protected getQueryUrl(config: CrawlerConfiguration) {
		const { area, maxPrice, minPrice } = config
		const { city, district } = this.getAreaUrlParam(area)
		const url = new URL(`${this.SEARCH_BASE_URL}/${city}/${district}`)
		url.searchParams.append('order_by', 'moi-nhat')
		minPrice &&
			url.searchParams.append('gia_tu', (minPrice * 1000000).toString())
		maxPrice &&
			url.searchParams.append('gia_den', (maxPrice * 1000000).toString())

		console.log(`Query for ${city} - ${district}: ` + url.toString())

		return url.toString()
	}

	private getAreaUrlParam(area: LocationArea) {
		const { city_code, district_code } = area

		const city = AREA_MAPPING.city_mapping_code[city_code]
		const district = AREA_MAPPING.district_mapping_code[city][district_code]

		if (!city || !district) {
			throw new Error('Invalid area code')
		}

		return {
			city,
			district,
		}
	}

	private async getPropertyDetail(propUrl: string) {
		try {
			const response = await axios.get(propUrl)
			const $ = cheerio.load(response.data)
			const $prop = $('article.the-post')
			const propName = $prop.find('.page-header a').text()
			const address = $prop.find('.post-address').text()
			const id = $prop.find('.post-attributes .item.hashtag span').text()
			const price = $prop.find('.post-attributes .item.price span').text()
			const area = $prop
				.find('.post-attributes .item.acreage span')
				.text()
			// overview
			const $overview = $('.section.post-overview')
			const description = $('.section > .section-content')
				.text()
				.replace(/<(\/)?p>/, '.')
			const publishedTime = $overview
				.find('table tr:nth-child(6) td:nth-child(2)')
				.text()
			// contact
			const $contact = $('.section.post-contact')
			const phoneNumber = $contact
				.find('table tr:nth-child(2) td:nth-child(2)')
				.text()
			// location
			const $location = $('.section.post-map')
			const mapUrl = $location.find('iframe').attr('src')
			return this.formatPropertyDetail({
				id,
				propUrl,
				propName,
				address,
				price,
				area,
				publishedTime,
				phoneNumber,
				mapUrl,
				description,
			})
		} catch (error) {
			throw error
		}
	}

	private formatPropertyDetail(propDetail: any): Accommodation {
		const {
			id,
			propUrl,
			propName,
			address,
			price,
			area,
			publishedTime,
			phoneNumber,
			mapUrl,
			description,
		} = propDetail

		const location = this.getAddressFromMapUrl(mapUrl)

		return {
			id,
			source: this.name,
			propertyName: propName,
			address: address.slice(9),
			area: parseArea(area),
			location,
			isLocationResolved: !!location,
			numberOfBedRooms: -1,
			numberOfWCs: -1,
			phoneNumber: phoneNumber.trim(),
			price: this.parsePrice(price),
			propUrl,
			publishedDate: moment(
				publishedTime.substr(-10),
				'DD/MM/YYYY',
			).format('DD/MM/YYYY'),
			description,
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

	private getAddressFromMapUrl(mapUrl: string): Coordination {
		const url = new URL(mapUrl)
		const placeQuery = url.searchParams.get('q')
		const [latitude, longitude] = placeQuery.split(',').map(parseFloat)
		if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
			return null
		}
		return {
			longitude,
			latitude,
		}
	}

	private parsePrice(priceStr: string) {
		// format of price is like '3.5 triệu/tháng' or '3 triệu/tháng'
		// WARNING: this function only works for price in million. Not applicable for price in billion like '1.5 tỷ/tháng'
		const priceParts = priceStr.split(' triệu/tháng')
		return parseFloat(priceParts[0])
	}
}
