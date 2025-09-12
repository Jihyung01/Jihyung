import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Zap,
  Eye,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'

interface WeatherData {
  location: string
  temperature: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  visibility: number
  feelsLike: number
  uvIndex: number
  pressure: number
  icon: string
  forecast: {
    date: string
    high: number
    low: number
    condition: string
    icon: string
  }[]
}

interface WeatherWidgetProps {
  className?: string
  compact?: boolean
  showForecast?: boolean
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  className = '',
  compact = false,
  showForecast = true,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Weather code mapping for Open-Meteo API
  const mapWeatherCode = (code: number) => {
    if (code === 0) return { condition: 'sunny', description: '맑음', icon: 'sun' }
    if ([1, 2, 3].includes(code))
      return { condition: 'partly-cloudy', description: '구름 조금', icon: 'partly-cloudy' }
    if ([45, 48].includes(code)) return { condition: 'cloudy', description: '흐림', icon: 'cloud' }
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
      return { condition: 'rainy', description: '비', icon: 'rain' }
    if ([71, 73, 75, 77, 85, 86].includes(code))
      return { condition: 'snowy', description: '눈', icon: 'snow' }
    if ([95, 96, 99].includes(code))
      return { condition: 'stormy', description: '뇌우', icon: 'stormy' }
    return { condition: 'cloudy', description: '흐림', icon: 'cloud' }
  }

  // Get user's current location
  const getCurrentLocation = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback to Seoul coordinates
        resolve({ lat: 37.57, lon: 126.98 })
        return
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        error => {
          console.warn('Location access denied, using Seoul as default:', error)
          // Fallback to Seoul coordinates
          resolve({ lat: 37.57, lon: 126.98 })
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    })
  }

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get user's current location
      const location = await getCurrentLocation()

      // Call Open-Meteo API for real weather data
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,visibility,uv_index,pressure_msl,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&forecast_days=6`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json()

      const current = data.current_weather
      const hourly = data.hourly
      const daily = data.daily

      // Find current hour index for detailed data
      const currentTime = new Date(current.time)
      const currentHourIndex = hourly.time.findIndex(
        (time: string) =>
          new Date(time).getHours() === currentTime.getHours() &&
          new Date(time).getDate() === currentTime.getDate()
      )

      // Map weather code to our format
      const weatherMapping = mapWeatherCode(current.weathercode)

      // Determine location name (default to Seoul if geolocation used)
      const locationName =
        location.lat === 37.57 && location.lon === 126.98 ? '서울, 대한민국' : '현재 위치'

      const weatherData: WeatherData = {
        location: locationName,
        temperature: Math.round(current.temperature),
        condition: weatherMapping.condition,
        description: weatherMapping.description,
        humidity:
          currentHourIndex >= 0 ? Math.round(hourly.relativehumidity_2m[currentHourIndex]) : 0,
        windSpeed: Math.round(current.windspeed || 0),
        visibility:
          currentHourIndex >= 0
            ? Math.round((hourly.visibility[currentHourIndex] || 10000) / 1000)
            : 10,
        feelsLike:
          currentHourIndex >= 0
            ? Math.round(hourly.apparent_temperature[currentHourIndex])
            : Math.round(current.temperature),
        uvIndex: currentHourIndex >= 0 ? Math.round(hourly.uv_index[currentHourIndex] || 0) : 0,
        pressure:
          currentHourIndex >= 0 ? Math.round(hourly.pressure_msl[currentHourIndex] || 1013) : 1013,
        icon: weatherMapping.icon,
        forecast: daily.time.slice(1, 6).map((date: string, index: number) => {
          const forecastMapping = mapWeatherCode(daily.weathercode[index + 1])
          return {
            date: new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' }),
            high: Math.round(daily.temperature_2m_max[index + 1]),
            low: Math.round(daily.temperature_2m_min[index + 1]),
            condition: forecastMapping.condition,
            icon: forecastMapping.icon,
          }
        }),
      }

      setWeather(weatherData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError('날씨 정보를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather()

    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-8 w-8 text-yellow-500" />
      case 'cloudy':
        return <Cloud className="h-8 w-8 text-gray-500" />
      case 'rainy':
        return <CloudRain className="h-8 w-8 text-blue-500" />
      case 'snowy':
        return <CloudSnow className="h-8 w-8 text-blue-200" />
      case 'stormy':
        return <Zap className="h-8 w-8 text-purple-500" />
      case 'partly-cloudy':
        return (
          <div className="relative">
            <Sun className="h-8 w-8 text-yellow-500" />
            <Cloud className="h-4 w-4 text-gray-400 absolute top-0 right-0" />
          </div>
        )
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />
    }
  }

  const getTemperatureColor = (temp: number) => {
    if (temp >= 30) return 'text-red-500'
    if (temp >= 25) return 'text-orange-500'
    if (temp >= 20) return 'text-green-500'
    if (temp >= 10) return 'text-blue-500'
    return 'text-blue-700'
  }

  const getUVLevel = (uvIndex: number) => {
    if (uvIndex <= 2) return { level: '낮음', color: 'bg-green-500' }
    if (uvIndex <= 5) return { level: '보통', color: 'bg-yellow-500' }
    if (uvIndex <= 7) return { level: '높음', color: 'bg-orange-500' }
    if (uvIndex <= 10) return { level: '매우 높음', color: 'bg-red-500' }
    return { level: '위험', color: 'bg-purple-500' }
  }

  if (compact) {
    return (
      <motion.div
        className={`bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 ${className}`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-xs text-red-500 text-center">{error}</div>
        ) : weather ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getWeatherIcon(weather.condition)}
              <div>
                <div className={`text-lg font-bold ${getTemperatureColor(weather.temperature)}`}>
                  {weather.temperature}°C
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {weather.description}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchWeather}
              className="h-6 w-6 p-0"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        ) : null}
      </motion.div>
    )
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-blue-500" />
            실시간 날씨
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                {lastUpdated.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                업데이트
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchWeather}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <motion.div
            className="flex items-center justify-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              날씨 정보를 불러오는 중...
            </span>
          </motion.div>
        ) : error ? (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-red-500 mb-2">⚠️</div>
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            <Button variant="outline" size="sm" onClick={fetchWeather} className="mt-2">
              다시 시도
            </Button>
          </motion.div>
        ) : weather ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Current Weather */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {getWeatherIcon(weather.condition)}
                </motion.div>
                <div>
                  <div className={`text-3xl font-bold ${getTemperatureColor(weather.temperature)}`}>
                    {weather.temperature}°C
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">체감 {weather.feelsLike}°C</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <MapPin className="h-3 w-3" />
                  {weather.location}
                </div>
                <div className="text-lg font-medium">{weather.description}</div>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <motion.div
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">습도</span>
                </div>
                <div className="font-semibold">{weather.humidity}%</div>
              </motion.div>

              <motion.div
                className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Wind className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">바람</span>
                </div>
                <div className="font-semibold">{weather.windSpeed} m/s</div>
              </motion.div>

              <motion.div
                className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">가시거리</span>
                </div>
                <div className="font-semibold">{weather.visibility} km</div>
              </motion.div>

              <motion.div
                className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sun className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">자외선</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{weather.uvIndex}</span>
                  <Badge className={`text-xs ${getUVLevel(weather.uvIndex).color} text-white`}>
                    {getUVLevel(weather.uvIndex).level}
                  </Badge>
                </div>
              </motion.div>
            </div>

            {/* 5-Day Forecast */}
            {showForecast && weather.forecast && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  5일 날씨 예보
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {weather.forecast.map((day, index) => (
                    <motion.div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 text-center"
                      whileHover={{ scale: 1.05 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {day.date}
                      </div>
                      <div className="mb-2">{getWeatherIcon(day.condition)}</div>
                      <div className="text-xs">
                        <div className="font-semibold">{day.high}°</div>
                        <div className="text-gray-500">{day.low}°</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default WeatherWidget
