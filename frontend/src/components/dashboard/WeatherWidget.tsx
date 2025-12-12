/**
 * WEATHER WIDGET
 * Displays current weather, location, and time info
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../styles/theme';
import weatherService, { WeatherData } from '../../services/weather';

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const data = await weatherService.getWeather();
      if (data) {
        setWeatherData(data);
      } else {
        setError('Could not load weather data');
      }
    } catch (err) {
      // Weather fetch failed - showing fallback
      setError('Weather unavailable');
    } finally {
      setLoading(false);
    }
  };

  const getSeasonIcon = (season: string): keyof typeof Ionicons.glyphMap => {
    switch (season) {
      case 'Winter': return 'snow-outline';
      case 'Spring': return 'flower-outline';
      case 'Summer': return 'sunny-outline';
      case 'Autumn': return 'leaf-outline';
      default: return 'partly-sunny-outline';
    }
  };

  const getTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.loadingText}>Loading weather...</Text>
      </LinearGradient>
    );
  }

  if (error || !weatherData) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Ionicons name="cloud-offline-outline" size={32} color="#fff" />
        <Text style={styles.errorText}>{error || 'Weather unavailable'}</Text>
      </LinearGradient>
    );
  }

  const { location, weather, time, season } = weatherData;

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#fff" />
          <Text style={styles.locationText}>
            {location.city}, {location.state}
          </Text>
        </View>
        <View style={styles.seasonBadge}>
          <Ionicons name={getSeasonIcon(season)} size={14} color="#fff" />
          <Text style={styles.seasonText}>{season}</Text>
        </View>
      </View>

      {/* Main Weather Display */}
      <View style={styles.mainWeather}>
        <View style={styles.tempContainer}>
          {weather?.current?.icon_url && (
            <Image
              source={{ uri: weather.current.icon_url }}
              style={styles.weatherIcon}
            />
          )}
          <Text style={styles.temperature}>
            {weather?.current?.temperature || '--'}°
          </Text>
        </View>
        <Text style={styles.description}>
          {weather?.current?.description || 'N/A'}
        </Text>
        <Text style={styles.feelsLike}>
          Feels like {weather?.current?.feels_like || '--'}°F
        </Text>
      </View>

      {/* Weather Details Row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="water-outline" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.detailValue}>{weather?.current?.humidity || 0}%</Text>
          <Text style={styles.detailLabel}>Humidity</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Ionicons name="speedometer-outline" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.detailValue}>{weather?.current?.wind_speed || 0}</Text>
          <Text style={styles.detailLabel}>mph Wind</Text>
        </View>
      </View>

      {/* Time & Date */}
      <View style={styles.timeContainer}>
        <Text style={styles.greeting}>{getTimeGreeting()}</Text>
        <Text style={styles.timeText}>
          {time?.day_of_week}, {time?.formatted_date}
        </Text>
        <Text style={styles.timezone}>{time?.timezone_abbr}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 200,
  },
  loadingText: {
    color: '#fff',
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
  },
  errorText: {
    color: '#fff',
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginLeft: 4,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  seasonText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginLeft: 4,
  },
  mainWeather: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    width: 64,
    height: 64,
  },
  temperature: {
    fontSize: 56,
    fontWeight: '200',
    color: '#fff',
  },
  description: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '500',
    marginTop: 4,
  },
  feelsLike: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  detailItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  detailDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  detailValue: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
    marginTop: 4,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  timeContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  timeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  timezone: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
