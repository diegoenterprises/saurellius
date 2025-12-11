/**
 * 🌤️ WEATHER SERVICE
 * API calls for weather data
 */

import api from './api';

export interface WeatherLocation {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperature: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  icon_url: string;
  wind_speed: number;
  pressure: number;
  visibility: number;
}

export interface ForecastItem {
  time: string;
  temperature: number;
  description: string;
  icon: string;
  icon_url: string;
  pop: number;
}

export interface TimeInfo {
  current_time: string;
  current_date: string;
  formatted_date: string;
  formatted_time: string;
  day_of_week: string;
  timezone_name: string;
  timezone_abbr: string;
}

export interface WeatherData {
  status: string;
  location: WeatherLocation;
  weather: {
    current: CurrentWeather;
    forecast: ForecastItem[];
  };
  time: TimeInfo;
  season: 'Winter' | 'Spring' | 'Summer' | 'Autumn';
}

export const weatherService = {
  /**
   * Get full weather data based on user's IP location
   */
  getWeather: async (): Promise<WeatherData | null> => {
    try {
      const response = await api.get('/api/weather');
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      // Weather service unavailable
      return null;
    }
  },

  /**
   * Get user's location from IP
   */
  getLocation: async (): Promise<WeatherLocation | null> => {
    try {
      const response = await api.get('/api/weather/location');
      if (response.data.success) {
        return response.data.location;
      }
      return null;
    } catch (error) {
      console.error('Location service error:', error);
      return null;
    }
  },

  /**
   * Get weather by specific coordinates
   */
  getWeatherByCoords: async (lat: number, lon: number) => {
    try {
      const response = await api.get('/api/weather/by-coords', {
        params: { lat, lon }
      });
      if (response.data.success) {
        return {
          weather: response.data.weather,
          season: response.data.season
        };
      }
      return null;
    } catch (error) {
      console.error('Weather by coords error:', error);
      return null;
    }
  },

  /**
   * Get time info for a specific timezone
   */
  getTime: async (timezone: string = 'UTC'): Promise<TimeInfo | null> => {
    try {
      const response = await api.get('/api/time', {
        params: { timezone }
      });
      if (response.data.success) {
        return response.data.time;
      }
      return null;
    } catch (error) {
      console.error('Time service error:', error);
      return null;
    }
  },
};

export default weatherService;
