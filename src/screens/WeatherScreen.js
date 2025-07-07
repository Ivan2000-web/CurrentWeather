import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ImageBackground
} from 'react-native';

const { width } = Dimensions.get('window');

export default function WeatherScreen({ weatherData, onBack }) {
  if (!weatherData || !weatherData.data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Нет данных о погоде</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { city, data } = weatherData;
  const current = data.current_condition[0];
  const forecast = data.weather;

  const getWeatherIcon = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('ясно') || desc.includes('солнце')) return 'sunny';
    if (desc.includes('облач')) return 'cloudy';
    if (desc.includes('дождь') || desc.includes('ливень')) return 'rainy';
    if (desc.includes('снег')) return 'snow';
    if (desc.includes('туман')) return 'cloudy-night';
    if (desc.includes('гроза')) return 'thunderstorm';
    return 'partly-sunny';
  };

  const getBackgroundGradient = (temp) => {
    if (temp >= 25) return ['#FF6B6B', '#FF8E53']; // Жарко - красно-оранжевый
    if (temp >= 15) return ['#4ECDC4', '#44A08D']; // Тепло - бирюзовый
    if (temp >= 5) return ['#667eea', '#764ba2']; // Прохладно - фиолетовый
    return ['#2196F3', '#21CBF3']; // Холодно - синий
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    };
    return date.toLocaleDateString('ru-RU', options);
  };

  const getDayName = (dateStr, index) => {
    if (index === 0) return 'Сегодня';
    if (index === 1) return 'Завтра';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { weekday: 'long' });
  };

  // Функция для определения времени начала дождя
    // Функция для определения времени начала дождя
  const getRainStartTime = (dayData) => {
    if (!dayData.hourly || !Array.isArray(dayData.hourly)) {
      return null;
    }
    
    // Ищем первый час с вероятностью дождя больше 30%
    for (let i = 0; i < dayData.hourly.length; i++) {
      const hour = dayData.hourly[i];
      const rainChance = parseInt(hour.chanceofrain) || 0;
      
      if (rainChance > 30) {
        const time = String(hour.time).padStart(2, '0') + ':00';
        return { 
          time, 
          chance: rainChance,
          description: hour.weatherDesc[0]?.value || 'Дождь'
        };
      }
    }
    
    // Если не нашли конкретное время, но есть общая вероятность дождя
    const maxRainChance = Math.max(...dayData.hourly.map(h => parseInt(h.chanceofrain) || 0));
    if (maxRainChance > 10) {
      return { 
        time: null, 
        chance: maxRainChance,
        description: 'Возможен дождь'
      };
    }
    
    return null;
  };

  // Функция для получения информации о дожде на сегодня
  const getTodayRainInfo = () => {
    if (!forecast || forecast.length === 0) return null;
    
    const today = forecast[0];
    const rainInfo = getRainStartTime(today);
    
    if (rainInfo) {
      if (rainInfo.time) {
        return `${rainInfo.description} с ${rainInfo.time} (${rainInfo.chance}%)`;
      } else {
        return `${rainInfo.description} (до ${rainInfo.chance}%)`;
      }
    }
    
    return null;
  };

  // Функция для получения детальной информации о дожде для прогноза
  const getForecastRainInfo = (dayData) => {
    const rainInfo = getRainStartTime(dayData);
    
    if (rainInfo) {
      if (rainInfo.time) {
        return {
          text: `Дождь с ${rainInfo.time} (${rainInfo.chance}%)`,
          hasRain: true,
          icon: 'rainy'
        };
      } else {
        return {
          text: `Возможен дождь (${rainInfo.chance}%)`,
          hasRain: true,
          icon: 'rainy-outline'
        };
      }
    }
    
    return {
      text: 'Без осадков',
      hasRain: false,
      icon: 'sunny'
    };
  };

  // Функция для получения почасового прогноза дождя
  const getHourlyRainForecast = (dayData) => {
    if (!dayData.hourly || !Array.isArray(dayData.hourly)) {
      return [];
    }
    
    return dayData.hourly
      .filter(hour => hour.chanceofrain > 20)
      .map(hour => ({
        time: String(hour.time).padStart(2, '0') + ':00',
        chance: hour.chanceofrain,
        description: hour.weatherDesc[0]?.value || 'Дождь'
      }));
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.cityName}>{city}</Text>
          <Text style={styles.currentDate}>
            {new Date().toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Главная карточка с текущей погодой */}
        <View style={[styles.mainWeatherCard, { 
          backgroundColor: `linear-gradient(135deg, ${getBackgroundGradient(current.temp_C)[0]}, ${getBackgroundGradient(current.temp_C)[1]})` 
        }]}>
          <View style={styles.mainWeatherContent}>
            <View style={styles.temperatureSection}>
              <Text style={styles.mainTemp}>{current.temp_C}°</Text>
              <View style={styles.tempDetails}>
                <Text style={styles.feelsLike}>Ощущается как {current.FeelsLikeC}°</Text>
                <Text style={styles.weatherDescription}>{current.weatherDesc[0].value}</Text>
                {/* Информация о дожде */}
                {getTodayRainInfo() && (
                  <View style={styles.rainInfo}>
                    <Ionicons name="rainy" size={16} color="#ffffff" />
                    <Text style={styles.rainText}>{getTodayRainInfo()}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.weatherIconSection}>
              <Ionicons 
                name={getWeatherIcon(current.weatherDesc[0].value)} 
                size={80} 
                color="#ffffff" 
                style={styles.mainWeatherIcon}
              />
            </View>
          </View>
        </View>

        {/* Детали текущей погоды */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <Ionicons name="eye-outline" size={24} color="#60a5fa" />
            <Text style={styles.detailValue}>{current.visibility} км</Text>
            <Text style={styles.detailLabel}>Видимость</Text>
          </View>
          
          <View style={styles.detailCard}>
            <Ionicons name="water-outline" size={24} color="#60a5fa" />
            <Text style={styles.detailValue}>{current.humidity}%</Text>
            <Text style={styles.detailLabel}>Влажность</Text>
          </View>
          
          <View style={styles.detailCard}>
            <Ionicons name="speedometer-outline" size={24} color="#60a5fa" />
            <Text style={styles.detailValue}>{current.pressure}</Text>
            <Text style={styles.detailLabel}>Давление</Text>
          </View>
          
          <View style={styles.detailCard}>
            <Ionicons name="leaf-outline" size={24} color="#60a5fa" />
            <Text style={styles.detailValue}>{current.windSpeed} м/с</Text>
            <Text style={styles.detailLabel}>Ветер</Text>
          </View>
        </View>

        {/* Прогноз на 3 дня */}
        <View style={styles.forecastSection}>
          <Text style={styles.forecastTitle}>Прогноз на 3 дня</Text>
          {forecast.slice(0, 3).map((day, index) => {
            const rainInfo = getForecastRainInfo(day);
            const hourlyRain = getHourlyRainForecast(day);
            
            return (
              <View key={index} style={styles.forecastCard}>
                <View style={styles.forecastHeader}>
                  <View style={styles.forecastDateSection}>
                    <Text style={styles.forecastDay}>{getDayName(day.date, index)}</Text>
                    <Text style={styles.forecastDate}>{formatDate(day.date)}</Text>
                  </View>
                  
                  <View style={styles.forecastWeather}>
                    <Ionicons 
                      name={getWeatherIcon(day.hourly[0]?.weatherDesc[0]?.value || 'ясно')} 
                      size={32} 
                      color="#60a5fa" 
                    />
                    <View style={styles.forecastTemp}>
                      <Text style={styles.maxTemp}>{day.maxtempC}°</Text>
                      <Text style={styles.tempSeparator}>/</Text>
                      <Text style={styles.minTemp}>{day.mintempC}°</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.forecastDetails}>
                  <View style={styles.forecastDetailItem}>
                    <Ionicons name="water-outline" size={16} color="#93c5fd" />
                    <Text style={styles.forecastDetailText}>
                      Влажность: {day.hourly[0]?.humidity || 'N/A'}%
                    </Text>
                  </View>
                  
                  {/* Информация о дожде с временем */}
                  <View style={styles.forecastDetailItem}>
                    <Ionicons name={rainInfo.icon} size={16} color={rainInfo.hasRain ? "#60a5fa" : "#93c5fd"} />
                    <Text style={styles.forecastDetailText}>
                      {rainInfo.text}
                    </Text>
                  </View>
                  
                  {/* Почасовой прогноз дождя */}
                  {hourlyRain.length > 0 && (
                    <View style={styles.hourlyRainContainer}>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 30,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  cityName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  currentDate: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  placeholder: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainWeatherCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  mainWeatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  temperatureSection: {
    flex: 1,
  },
  mainTemp: {
    fontSize: 72,
    fontWeight: '300',
    color: '#ffffff',
    lineHeight: 80,
  },
  tempDetails: {
    marginTop: 8,
  },
  feelsLike: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  weatherDescription: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  weatherIconSection: {
    alignItems: 'center',
  },
  mainWeatherIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailValue: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  forecastSection: {
    marginBottom: 24,
  },
  forecastTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  forecastCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  forecastDateSection: {
    alignItems: 'flex-start',
  },
  forecastDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  forecastDate: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  forecastWeather: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  maxTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  tempSeparator: {
    fontSize: 18,
    color: '#ffffff',
    marginHorizontal: 4,
  },
  minTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#93c5fd',
  },
  forecastDetails: {
    marginTop: 8,
  },
  forecastDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  forecastDetailText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#cbd5e1',
  },
  forecastWeatherDesc: {
    marginLeft: 12,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 32,
  },
  rainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rainText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ffffff',
  },
});
