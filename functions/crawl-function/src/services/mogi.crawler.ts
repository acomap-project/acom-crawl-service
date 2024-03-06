import * as cheerio from 'cheerio'
import axios from 'axios'
import {
	CrawlerConfiguration,
	ICrawlService,
} from '../interfaces/crawler.interfaces'
import { Accommodation, Coordination, LocationArea } from 'src/models'
import { District } from 'src/constants'
import { parsePrice } from 'src/utils/crawler.utils'

export class MogiCrawler implements ICrawlService {
	name = 'mogi'
	private readonly BASE_URL = 'https://mogi.vn'
	private readonly PAGE_SIZE = 20
	private readonly MAX_CRAWL_SIZE = 100
	async crawl(config: CrawlerConfiguration) {
		try {
			const queryUrl = this.getQueryUrl(config)
			let page = 1
			const propertyList = []
			let pagedPropertList = []
			do {
				pagedPropertList.length = 0
				pagedPropertList = await this.getPropertyListForPage(
					queryUrl,
					page,
				)
				propertyList.push(...pagedPropertList)
				page++
			} while (
				pagedPropertList.length === this.PAGE_SIZE &&
				propertyList.length <= this.MAX_CRAWL_SIZE
			)
			return propertyList
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	protected async getPropertyListForPage(url: string, page: number) {
		const pageUrl = new URL(url)
		pageUrl.searchParams.append('cp', page.toString())
		const response = await axios.get(pageUrl.toString())
		const $ = cheerio.load(response.data)
		const properties = this.getAllProperties($)
		await Promise.all(
			properties.map((property) => this.getPropertyDetail(property)),
		)
		return properties.map((property) =>
			this.convertToPropertyInfo(property),
		)
	}

	protected getQueryUrl(config: CrawlerConfiguration) {
		const { area, lastPublishedDateRange, maxPrice, minPrice } = config
		const { city, district } = this.getAreaUrlParam(area)
		const url = new URL(
			`${this.BASE_URL}/${city}/${district}/thue-phong-tro-khu-nha-tro`,
		)
		minPrice && url.searchParams.append('fp', minPrice.toString())
		maxPrice && url.searchParams.append('tp', maxPrice.toString())
		lastPublishedDateRange &&
			url.searchParams.append('d', lastPublishedDateRange.toString())

		return url.toString()
	}

	private getAllProperties(
		$: cheerio.CheerioAPI,
		maxLength = this.MAX_CRAWL_SIZE,
	) {
		const properties = []
		$('.property-listing > ul.props > li').each((index, propHtml) => {
			if (index >= maxLength) {
				return
			}
			const $prop = $(propHtml)
			const imageUrl = $prop.find('.prop-img img').attr('src')
			const propUrl = $prop.find('.prop-info a').attr('href')
			const propertyName = $prop.find('.prop-info > a > h2').text()
			const price = $prop.find('.prop-info > .price').text()
			const attrs = $prop.find('.prop-info > .prop-attr li').toArray()
			const area = $(attrs[0]).text()
			const numberOfBedRooms = $(attrs[1]).text()
			const numberOfWCs = $(attrs[2]).text()
			properties.push({
				imageUrl,
				propUrl,
				propertyName,
				price,
				area,
				numberOfBedRooms,
				numberOfWCs,
			})
		})

		return properties
	}

	private async getPropertyDetail(property: any) {
		try {
			const response = await axios.get(property.propUrl)
			const $ = cheerio.load(response.data)
			// return $.html()
			const $propDetail = $(
				'.property-detail-main .main-info .info-attrs',
			)
			const address = $(
				'.property-detail-main .main-info .address',
			).text()
			const description = $(
				'.property-detail-main .main-info .info-content-body',
			)
				.text()
				.replace(/<(\/)?br>/, '.')
			const $infoList = $propDetail.find('div.info-attr').toArray()
			const publishedDate = $($infoList[2]).find('span:last()').text()
			const mapUrl = $('.map-content > iframe').attr('data-src')
			const phoneNumber = $('.agent-contact a span:first()').text()
			property.publishedDate = publishedDate
			property.mapUrl = mapUrl
			property.phoneNumber = phoneNumber
			property.address = address
			property.description = description
			return property
		} catch (error) {
			throw error
		}
	}

	private convertToPropertyInfo(plainData: any): Accommodation {
		const {
			imageUrl,
			propUrl,
			propertyName,
			price,
			area,
			numberOfBedRooms,
			numberOfWCs,
			publishedDate,
			mapUrl,
			phoneNumber,
			address,
			description,
		} = plainData

		let id
		const idPosition = new URL(propUrl).pathname.split('-').pop()
		if (idPosition) {
			id = idPosition.slice(2)
		}

		const location = this.getAddressFromMapUrl(mapUrl)

		return {
			id,
			source: this.name,
			propUrl,
			area: parseInt(area.split(' ')[0]),
			address,
			numberOfBedRooms: parseInt(numberOfBedRooms.split(' ')[0]),
			numberOfWCs: parseInt(numberOfWCs.split(' ')[0]),
			phoneNumber: phoneNumber.trimStart(),
			propertyName,
			price: parsePrice(price),
			publishedDate: publishedDate,
			description,
			location,
			isLocationResolved: !!location,
		}
	}

	private getDistrictValue(district: District) {
		switch (district) {
			case District.BinhThanh:
				return 'quan-binh-thanh'
			case District.PhuNhuan:
				return 'quan-phu-nhuan'
			case District.GoVap:
				return 'quan-go-vap'
			case District.ThuDuc:
				return 'quan-thu-duc'
		}
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

	private getAreaUrlParam(area: LocationArea) {
		const { city_code, district_code } = area

		let district
		switch (district_code) {
			case 'quan-1':
				district = 'quan-1'
				break
			case 'quan-2':
				district = 'quan-2'
				break
			case 'quan-3':
				district = 'quan-3'
				break
			case 'thu-duc':
				district = 'quan-thu-duc'
				break
			case 'binh-thanh':
				district = 'quan-binh-thanh'
				break
			case 'go-vap':
				district = 'quan-go-vap'
				break
			case 'phu-nhuan':
				district = 'quan-phu-nhuan'
				break
		}

		return {
			city: city_code,
			district: district,
		}
	}
}
