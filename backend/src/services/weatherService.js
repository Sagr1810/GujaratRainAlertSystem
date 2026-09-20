/**
 * IMD Live Weather Service
 * Uses Open-Meteo API — free, no key, updates from WMO/ECMWF models (same source IMD uses)
 * Data refreshes every 10 minutes via cron
 * IMD standard alert thresholds applied
 */
const axios = require('axios');

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

// IMD Standard Alert Thresholds (24h rainfall in mm)
const getAlertLevel = (rainfall_mm) => {
  if (rainfall_mm >= 204.5) return 'dark_red';   // Extremely Heavy
  if (rainfall_mm >= 115.6) return 'red';          // Very Heavy
  if (rainfall_mm >= 64.5)  return 'orange';       // Heavy
  if (rainfall_mm >= 35.5)  return 'yellow';       // Moderate-Heavy
  return 'normal';
};

// WMO Weather Code → IMD description
const wmoToDesc = (code) => {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 9) return 'Foggy';
  if (code <= 19) return 'Drizzle';
  if (code <= 29) return 'Rain showers';
  if (code <= 39) return 'Fog';
  if (code <= 49) return 'Freezing fog';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 84) return 'Rain showers';
  if (code <= 94) return 'Thunderstorm';
  return 'Heavy thunderstorm';
};

const wmoToIcon = (code) => {
  if (code === 0) return '01d';
  if (code <= 3) return '02d';
  if (code <= 9) return '50d';
  if (code <= 59) return '09d';
  if (code <= 69) return '10d';
  if (code <= 79) return '13d';
  if (code <= 84) return '09d';
  return '11d';
};

/**
 * Fetch current IMD-equivalent weather for a lat/lng using Open-Meteo
 * Falls back to realistic mock if API unavailable
 */
const fetchCurrentWeather = async (lat, lng) => {
  try {
    const response = await axios.get(OPEN_METEO_BASE, {
      params: {
        latitude: lat,
        longitude: lng,
        current: [
          'temperature_2m',
          'relativehumidity_2m',
          'precipitation',
          'rain',
          'weathercode',
          'windspeed_10m',
          'winddirection_10m',
          'surface_pressure',
          'visibility',
          'cloudcover',
        ].join(','),
        hourly: 'precipitation,rain',
        daily: 'precipitation_sum,rain_sum',
        timezone: 'Asia/Kolkata',
        forecast_days: 1,
      },
      timeout: 10000,
    });

    const c = response.data.current;
    const daily = response.data.daily;

    const rainfall_1h = parseFloat((c.precipitation || 0).toFixed(2));
    const rainfall_24h = parseFloat((daily?.precipitation_sum?.[0] || c.precipitation * 24 || 0).toFixed(2));
    const rainfall_3h = parseFloat((rainfall_1h * 3).toFixed(2));

    return {
      rainfall_mm: rainfall_1h,
      rainfall_1h,
      rainfall_3h,
      rainfall_24h,
      temperature: parseFloat((c.temperature_2m || 0).toFixed(1)),
      humidity: Math.round(c.relativehumidity_2m || 0),
      wind_speed: parseFloat(((c.windspeed_10m || 0) / 3.6).toFixed(1)), // km/h → m/s
      wind_direction: Math.round(c.winddirection_10m || 0),
      pressure: parseFloat((c.surface_pressure || 1013).toFixed(1)),
      visibility_km: parseFloat(((c.visibility || 10000) / 1000).toFixed(1)),
      cloud_cover: Math.round(c.cloudcover || 0),
      weather_desc: wmoToDesc(c.weathercode || 0),
      weather_icon: wmoToIcon(c.weathercode || 0),
      alert_level: getAlertLevel(rainfall_24h),
      source: 'imd_openmeteo',
    };
  } catch (err) {
    return generateMockWeather(lat, lng);
  }
};

/**
 * Fetch 5-day forecast using Open-Meteo
 */
const fetchForecast = async (lat, lng) => {
  try {
    const response = await axios.get(OPEN_METEO_BASE, {
      params: {
        latitude: lat,
        longitude: lng,
        daily: [
          'precipitation_sum',
          'rain_sum',
          'temperature_2m_max',
          'temperature_2m_min',
          'weathercode',
          'precipitation_probability_max',
          'windspeed_10m_max',
          'uv_index_max',
          'apparent_temperature_max',
          'apparent_temperature_min',
        ].join(','),
        hourly: [
          'temperature_2m',
          'precipitation',
          'precipitation_probability',
          'weathercode',
          'windspeed_10m',
          'relativehumidity_2m',
          'apparent_temperature',
        ].join(','),
        timezone: 'Asia/Kolkata',
        forecast_days: 7,
      },
      timeout: 10000,
    });

    const d = response.data.daily;
    const h = response.data.hourly;

    // Daily 7-day forecast
    const daily = d.time.slice(0, 7).map((date, i) => ({
      forecast_time: new Date(date),
      temp_min: parseFloat((d.temperature_2m_min?.[i] || 22).toFixed(1)),
      temp_max: parseFloat((d.temperature_2m_max?.[i] || 32).toFixed(1)),
      feels_min: parseFloat((d.apparent_temperature_min?.[i] || 22).toFixed(1)),
      feels_max: parseFloat((d.apparent_temperature_max?.[i] || 32).toFixed(1)),
      rainfall_mm: parseFloat((d.precipitation_sum?.[i] || 0).toFixed(2)),
      pop: Math.round(d.precipitation_probability_max?.[i] || 0),
      weather_desc: wmoToDesc(d.weathercode?.[i] || 0),
      weather_icon: wmoToIcon(d.weathercode?.[i] || 0),
      wind_speed: parseFloat(((d.windspeed_10m_max?.[i] || 0) / 3.6).toFixed(1)),
      uv_index: parseFloat((d.uv_index_max?.[i] || 0).toFixed(1)),
      alert_level: getAlertLevel(d.precipitation_sum?.[i] || 0),
    }));

    // Hourly for today only (first 24 entries)
    const hourly = h && h.time ? h.time.slice(0, 24).map((t, i) => ({
      hour: new Date(t).getHours(),
      time_label: new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      temp: parseFloat((h.temperature_2m?.[i] || 25).toFixed(1)),
      feels_like: parseFloat((h.apparent_temperature?.[i] || 25).toFixed(1)),
      rain: parseFloat((h.precipitation?.[i] || 0).toFixed(2)),
      pop: Math.round(h.precipitation_probability?.[i] || 0),
      wind: parseFloat(((h.windspeed_10m?.[i] || 0) / 3.6).toFixed(1)),
      humidity: Math.round(h.relativehumidity_2m?.[i] || 0),
      weather_icon: wmoToIcon(h.weathercode?.[i] || 0),
    })) : [];

    return { daily, hourly };
  } catch (err) {
    const daily = generateMockForecast();
    return { daily, hourly: generateMockHourly() };
  }
};

// Monsoon-aware mock fallback
const generateMockWeather = (lat, lng) => {
  const monsoonMonths = [6, 7, 8, 9];
  const month = new Date().getMonth() + 1;
  const isMonsoon = monsoonMonths.includes(month);
  const baseRain = isMonsoon ? Math.random() * 80 : Math.random() * 5;
  const rainfall_1h = parseFloat(baseRain.toFixed(2));
  const rainfall_24h = parseFloat((baseRain * 8 * (0.8 + Math.random() * 0.4)).toFixed(2));
  return {
    rainfall_mm: rainfall_1h,
    rainfall_1h,
    rainfall_3h: parseFloat((baseRain * 3).toFixed(2)),
    rainfall_24h,
    temperature: parseFloat((22 + Math.random() * 12).toFixed(1)),
    humidity: Math.round(60 + Math.random() * 35),
    wind_speed: parseFloat((5 + Math.random() * 25).toFixed(1)),
    wind_direction: Math.round(Math.random() * 360),
    pressure: parseFloat((1000 + Math.random() * 20).toFixed(1)),
    visibility_km: parseFloat((5 + Math.random() * 5).toFixed(1)),
    cloud_cover: Math.round(isMonsoon ? 60 + Math.random() * 40 : Math.random() * 40),
    weather_desc: isMonsoon ? 'Heavy rain' : 'Partly cloudy',
    weather_icon: isMonsoon ? '09d' : '02d',
    alert_level: getAlertLevel(rainfall_24h),
    source: 'mock',
  };
};

const generateMockForecast = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const rain = Math.random() * 60;
    const tmin = parseFloat((22 + Math.random() * 5).toFixed(1));
    const tmax = parseFloat((28 + Math.random() * 8).toFixed(1));
    return {
      forecast_time: date,
      temp_min: tmin,
      temp_max: tmax,
      feels_min: parseFloat((tmin - 1).toFixed(1)),
      feels_max: parseFloat((tmax + 2).toFixed(1)),
      rainfall_mm: parseFloat(rain.toFixed(2)),
      pop: Math.round(Math.random() * 100),
      weather_desc: rain > 60 ? 'Heavy rain' : rain > 30 ? 'Moderate rain' : 'Light rain',
      weather_icon: rain > 60 ? '10d' : '09d',
      wind_speed: parseFloat((5 + Math.random() * 20).toFixed(1)),
      uv_index: parseFloat((Math.random() * 10).toFixed(1)),
      alert_level: getAlertLevel(rain),
    };
  });
};

const generateMockHourly = () => {
  return Array.from({ length: 24 }, (_, i) => {
    const rain = i >= 14 && i <= 18 ? Math.random() * 8 : Math.random() * 1;
    // simulate heat curve: coolest at 5am, hottest at 2pm
    const base = 24;
    const swing = 8;
    const temp = parseFloat((base + swing * Math.sin((i - 5) * Math.PI / 18)).toFixed(1));
    return {
      hour: i,
      time_label: `${String(i).padStart(2, '0')}:00`,
      temp,
      feels_like: parseFloat((temp + 1.5).toFixed(1)),
      rain: parseFloat(rain.toFixed(2)),
      pop: Math.round(rain > 3 ? 70 + Math.random() * 30 : Math.random() * 40),
      wind: parseFloat((3 + Math.random() * 10).toFixed(1)),
      humidity: Math.round(55 + Math.random() * 40),
      weather_icon: rain > 3 ? '09d' : temp > 30 ? '01d' : '02d',
    };
  });
};

module.exports = { fetchCurrentWeather, fetchForecast, getAlertLevel };
