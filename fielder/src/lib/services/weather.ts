/**
 * Weather Service - External weather data integration
 *
 * Uses Open-Meteo API (free, no API key required) for:
 * - Historical weather data
 * - Weather forecasts
 * - Climatology (30-year averages derived from historical data)
 *
 * The key insight: Regional weather + horticultural models = predicted harvest windows.
 * We don't need farm-specific sensors.
 */

import { REGION_COORDINATES } from '../constants/regions'
import { calculateDailyGdd } from './gdd-calculator'

// ============================================================================
// Types
// ============================================================================

export interface WeatherObservation {
  date: Date
  locationId: string
  tempHigh: number  // Fahrenheit
  tempLow: number   // Fahrenheit
  tempAvg: number   // Fahrenheit
  precipInches: number
  humidityPct?: number
  solarRadiationMj?: number
}

export interface CurrentWeather {
  locationId: string
  timestamp: Date
  temperature: number       // Current temp (Fahrenheit)
  apparentTemp: number      // Feels like (Fahrenheit)
  humidity: number          // Percentage
  windSpeed: number         // mph
  windDirection: number     // degrees
  weatherCode: number       // WMO code
  weatherDescription: string
  isDay: boolean
  // Today's data for GDD calculation
  tempHighToday: number
  tempLowToday: number
  todayGdd: number          // GDD accumulated today so far
}

export interface WeatherForecast {
  date: Date
  locationId: string
  tempHigh: number
  tempLow: number
  precipProbability: number  // 0-1
  confidence: number         // 0-1, decreases further out
}

export interface RegionalWeatherSummary {
  regionId: string
  startDate: Date
  endDate: Date
  totalGdd: number
  avgDailyGdd: number
  avgHigh: number
  avgLow: number
  minTemp: number
  maxTemp: number
  totalPrecipInches: number
  rainDays: number
  frostEvents: number
  lastFrostDate: Date | null
  chillHours: number
  observationCount: number
  missingDays: number
}

export interface Climatology {
  avgHigh: number
  avgLow: number
  avgTemp: number
  avgDailyPrecip: number
  avgDailyGdd: number
  avgDailyGdd50: number
  avgDailyGdd55: number
  observationCount: number
  yearsSampled: number
}

// ============================================================================
// Open-Meteo API Response Types
// ============================================================================

interface OpenMeteoDaily {
  time: string[]
  temperature_2m_max: (number | null)[]
  temperature_2m_min: (number | null)[]
  precipitation_sum?: (number | null)[]
  precipitation_probability_max?: (number | null)[]
}

interface OpenMeteoCurrent {
  time: string
  interval: number
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  is_day: number
  weather_code: number
  wind_speed_10m: number
  wind_direction_10m: number
}

interface OpenMeteoResponse {
  daily?: OpenMeteoDaily
  current?: OpenMeteoCurrent
  error?: boolean
  reason?: string
}

// WMO Weather interpretation codes
const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
}

// ============================================================================
// Weather Service Class
// ============================================================================

class WeatherService {
  private historicalUrl = 'https://archive-api.open-meteo.com/v1/archive'
  private forecastUrl = 'https://api.open-meteo.com/v1/forecast'
  private climatologyCache: Map<string, Climatology> = new Map()

  /**
   * Convert Celsius to Fahrenheit
   */
  private celsiusToFahrenheit(celsius: number): number {
    return celsius * 9 / 5 + 32
  }

  /**
   * Get coordinates for a region ID
   */
  private getCoordinates(locationId: string): { lat: number; lon: number } {
    const coords = REGION_COORDINATES[locationId]
    if (!coords) {
      throw new Error(`Unknown location_id: ${locationId}`)
    }
    return coords
  }

  /**
   * Fetch JSON from Open-Meteo API
   */
  private async fetchJson(baseUrl: string, params: Record<string, string | number>): Promise<OpenMeteoResponse> {
    const queryString = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString()
    const url = `${baseUrl}?${queryString}`

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        // Cache weather data for 1 hour
        next: { revalidate: 3600 }
      })

      if (!response.ok) {
        console.error(`Weather API error: ${response.status}`)
        return { error: true, reason: `HTTP ${response.status}` }
      }

      return await response.json()
    } catch (error) {
      console.error('Weather fetch error:', error)
      return { error: true, reason: String(error) }
    }
  }

  /**
   * Get historical weather data from Open-Meteo archive
   */
  async getHistorical(
    locationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherObservation[]> {
    const { lat, lon } = this.getCoordinates(locationId)

    const params = {
      latitude: lat,
      longitude: lon,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
      temperature_unit: 'celsius',
      precipitation_unit: 'inch',
      timezone: 'auto'
    }

    const data = await this.fetchJson(this.historicalUrl, params)

    if (!data.daily) return []

    const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily
    const observations: WeatherObservation[] = []

    for (let i = 0; i < time.length; i++) {
      const tMax = temperature_2m_max[i]
      const tMin = temperature_2m_min[i]

      if (tMax === null || tMin === null) continue

      const tempHigh = this.celsiusToFahrenheit(tMax)
      const tempLow = this.celsiusToFahrenheit(tMin)

      observations.push({
        date: new Date(time[i]),
        locationId,
        tempHigh,
        tempLow,
        tempAvg: (tempHigh + tempLow) / 2,
        precipInches: precipitation_sum?.[i] ?? 0
      })
    }

    return observations
  }

  /**
   * Get weather forecast from Open-Meteo
   */
  async getForecast(
    locationId: string,
    daysAhead: number = 7
  ): Promise<WeatherForecast[]> {
    const { lat, lon } = this.getCoordinates(locationId)

    const params = {
      latitude: lat,
      longitude: lon,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      temperature_unit: 'celsius',
      forecast_days: Math.min(daysAhead, 16), // Max 16 days
      timezone: 'auto'
    }

    const data = await this.fetchJson(this.forecastUrl, params)

    if (!data.daily) return []

    const { time, temperature_2m_max, temperature_2m_min, precipitation_probability_max } = data.daily
    const forecasts: WeatherForecast[] = []

    for (let i = 0; i < time.length; i++) {
      const tMax = temperature_2m_max[i]
      const tMin = temperature_2m_min[i]

      if (tMax === null || tMin === null) continue

      // Confidence decreases for forecasts further out
      const confidence = Math.max(0.5, 0.95 - (i * 0.03))

      forecasts.push({
        date: new Date(time[i]),
        locationId,
        tempHigh: this.celsiusToFahrenheit(tMax),
        tempLow: this.celsiusToFahrenheit(tMin),
        precipProbability: (precipitation_probability_max?.[i] ?? 0) / 100,
        confidence
      })
    }

    return forecasts
  }

  /**
   * Get current weather conditions from Open-Meteo
   * Includes today's high/low for GDD calculation
   */
  async getCurrentWeather(
    locationId: string,
    gddBaseTemp: number = 55
  ): Promise<CurrentWeather | null> {
    const { lat, lon } = this.getCoordinates(locationId)

    const params = {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m',
      daily: 'temperature_2m_max,temperature_2m_min',
      temperature_unit: 'celsius',
      wind_speed_unit: 'mph',
      forecast_days: 1,
      timezone: 'auto'
    }

    const data = await this.fetchJson(this.forecastUrl, params)

    if (!data.current || !data.daily) {
      console.error('Current weather data not available')
      return null
    }

    const { current, daily } = data

    const tempF = this.celsiusToFahrenheit(current.temperature_2m)
    const apparentF = this.celsiusToFahrenheit(current.apparent_temperature)
    const highF = daily.temperature_2m_max[0] !== null
      ? this.celsiusToFahrenheit(daily.temperature_2m_max[0])
      : tempF
    const lowF = daily.temperature_2m_min[0] !== null
      ? this.celsiusToFahrenheit(daily.temperature_2m_min[0])
      : tempF

    // Calculate today's GDD using the daily high/low
    const todayGdd = calculateDailyGdd(highF, lowF, gddBaseTemp)

    return {
      locationId,
      timestamp: new Date(current.time),
      temperature: Math.round(tempF * 10) / 10,
      apparentTemp: Math.round(apparentF * 10) / 10,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: current.wind_direction_10m,
      weatherCode: current.weather_code,
      weatherDescription: WMO_CODES[current.weather_code] || 'Unknown',
      isDay: current.is_day === 1,
      tempHighToday: Math.round(highF * 10) / 10,
      tempLowToday: Math.round(lowF * 10) / 10,
      todayGdd: Math.round(todayGdd * 10) / 10,
    }
  }

  /**
   * Calculate climatology from historical archive (5-year average)
   */
  async getClimatology(
    locationId: string,
    month: number
  ): Promise<Climatology> {
    const cacheKey = `${locationId}-${month}`
    const cached = this.climatologyCache.get(cacheKey)
    if (cached) return cached

    const currentYear = new Date().getFullYear()
    const allObservations: WeatherObservation[] = []

    // Get last 5 years of data for this month
    for (let year = currentYear - 5; year < currentYear; year++) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0) // Last day of month

      try {
        const obs = await this.getHistorical(locationId, startDate, endDate)
        allObservations.push(...obs)
      } catch {
        // Skip years with missing data
        continue
      }
    }

    if (allObservations.length === 0) {
      return this.getDefaultClimatology(locationId, month)
    }

    const avgHigh = allObservations.reduce((sum, o) => sum + o.tempHigh, 0) / allObservations.length
    const avgLow = allObservations.reduce((sum, o) => sum + o.tempLow, 0) / allObservations.length
    const avgPrecip = allObservations.reduce((sum, o) => sum + o.precipInches, 0) / allObservations.length
    const avgGdd50 = allObservations.reduce((sum, o) =>
      sum + calculateDailyGdd(o.tempHigh, o.tempLow, 50), 0) / allObservations.length
    const avgGdd55 = allObservations.reduce((sum, o) =>
      sum + calculateDailyGdd(o.tempHigh, o.tempLow, 55), 0) / allObservations.length

    const result: Climatology = {
      avgHigh: Math.round(avgHigh * 10) / 10,
      avgLow: Math.round(avgLow * 10) / 10,
      avgTemp: Math.round((avgHigh + avgLow) / 2 * 10) / 10,
      avgDailyPrecip: Math.round(avgPrecip * 100) / 100,
      avgDailyGdd: Math.round(avgGdd55 * 10) / 10,
      avgDailyGdd50: Math.round(avgGdd50 * 10) / 10,
      avgDailyGdd55: Math.round(avgGdd55 * 10) / 10,
      observationCount: allObservations.length,
      yearsSampled: 5
    }

    this.climatologyCache.set(cacheKey, result)
    return result
  }

  /**
   * Get default climatology when historical data unavailable
   */
  private getDefaultClimatology(locationId: string, month: number): Climatology {
    // Basic defaults based on US regions
    const isWinter = month <= 2 || month === 12
    const isSummer = month >= 6 && month <= 8

    const { lat } = this.getCoordinates(locationId)
    const isSouthern = lat < 35

    let avgHigh: number, avgLow: number

    if (isSouthern) {
      avgHigh = isWinter ? 65 : isSummer ? 92 : 78
      avgLow = isWinter ? 45 : isSummer ? 72 : 58
    } else {
      avgHigh = isWinter ? 35 : isSummer ? 82 : 55
      avgLow = isWinter ? 20 : isSummer ? 60 : 38
    }

    return {
      avgHigh,
      avgLow,
      avgTemp: (avgHigh + avgLow) / 2,
      avgDailyPrecip: 0.1,
      avgDailyGdd: calculateDailyGdd(avgHigh, avgLow, 55),
      avgDailyGdd50: calculateDailyGdd(avgHigh, avgLow, 50),
      avgDailyGdd55: calculateDailyGdd(avgHigh, avgLow, 55),
      observationCount: 0,
      yearsSampled: 0
    }
  }

  /**
   * Calculate GDD accumulation from a reference date to today
   */
  async getGddAccumulation(
    locationId: string,
    referenceDate: Date,
    baseTemp: number = 55
  ): Promise<{ totalGdd: number; avgDailyGdd: number; days: number }> {
    const today = new Date()
    const observations = await this.getHistorical(locationId, referenceDate, today)

    const totalGdd = observations.reduce((sum, o) =>
      sum + calculateDailyGdd(o.tempHigh, o.tempLow, baseTemp), 0)

    return {
      totalGdd: Math.round(totalGdd),
      avgDailyGdd: observations.length > 0
        ? Math.round(totalGdd / observations.length * 10) / 10
        : 0,
      days: observations.length
    }
  }

  /**
   * Get summary stats for a region over a time period
   */
  async getRegionalSummary(
    regionId: string,
    startDate: Date,
    endDate: Date,
    baseTemp: number = 55
  ): Promise<RegionalWeatherSummary> {
    const observations = await this.getHistorical(regionId, startDate, endDate)

    if (observations.length === 0) {
      return {
        regionId,
        startDate,
        endDate,
        totalGdd: 0,
        avgDailyGdd: 0,
        avgHigh: 0,
        avgLow: 0,
        minTemp: 0,
        maxTemp: 0,
        totalPrecipInches: 0,
        rainDays: 0,
        frostEvents: 0,
        lastFrostDate: null,
        chillHours: 0,
        observationCount: 0,
        missingDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    }

    const totalGdd = observations.reduce((sum, o) =>
      sum + calculateDailyGdd(o.tempHigh, o.tempLow, baseTemp), 0)

    const frostDays = observations.filter(o => o.tempLow < 32)
    const lastFrost = frostDays.length > 0
      ? frostDays[frostDays.length - 1].date
      : null

    // Estimate chill hours (rough: hours when temp is 32-45F)
    // Assume 8 chill hours per day where avg temp is in range
    const chillDays = observations.filter(o =>
      o.tempAvg >= 32 && o.tempAvg <= 45)
    const chillHours = chillDays.length * 8

    const expectedDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      regionId,
      startDate,
      endDate,
      totalGdd: Math.round(totalGdd),
      avgDailyGdd: Math.round(totalGdd / observations.length * 10) / 10,
      avgHigh: Math.round(observations.reduce((sum, o) => sum + o.tempHigh, 0) / observations.length * 10) / 10,
      avgLow: Math.round(observations.reduce((sum, o) => sum + o.tempLow, 0) / observations.length * 10) / 10,
      minTemp: Math.min(...observations.map(o => o.tempLow)),
      maxTemp: Math.max(...observations.map(o => o.tempHigh)),
      totalPrecipInches: Math.round(observations.reduce((sum, o) => sum + o.precipInches, 0) * 100) / 100,
      rainDays: observations.filter(o => o.precipInches > 0.01).length,
      frostEvents: frostDays.length,
      lastFrostDate: lastFrost,
      chillHours,
      observationCount: observations.length,
      missingDays: expectedDays - observations.length
    }
  }
}

// Export singleton instance
export const weatherService = new WeatherService()
