const WEATHER_API_BASE_URL = 'https://api.open-meteo.com/v1';

// Новая функция для поиска городов
export const searchCities = async (query) => {
  try {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ru&format=json`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WeatherApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const cities = data.results ? data.results.map(city => ({
      id: city.id,
      name: city.name,
      country: city.country,
      admin1: city.admin1,
      latitude: city.latitude,
      longitude: city.longitude,
      displayName: `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}, ${city.country}`
    })) : [];

    return {
      success: true,
      data: cities,
    };
  } catch (error) {
    console.error('Search Cities Error:', error);
    return {
      success: false,
      error: 'Не удалось найти города',
      data: [],
    };
  }
};

export const getWeatherData = async (city) => {
  try {
    // Сначала получаем координаты города
    const geocodingResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WeatherApp/1.0',
        },
      }
    );

    if (!geocodingResponse.ok) {
      throw new Error(`HTTP error! status: ${geocodingResponse.status}`);
    }

    const geocodingData = await geocodingResponse.json();
    
    if (!geocodingData.results || geocodingData.results.length === 0) {
      throw new Error('Город не найден');
    }

    const { latitude, longitude, name } = geocodingData.results[0];

    // Получаем данные о погоде
    const weatherResponse = await fetch(
      `${WEATHER_API_BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,visibility,apparent_temperature,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WeatherApp/1.0',
        },
      }
    );

    if (!weatherResponse.ok) {
      throw new Error('Не удалось получить данные о погоде');
    }

    const weatherData = await weatherResponse.json();
    
    // Преобразуем данные в удобный формат
    const transformedData = {
      current_condition: [{
        temp_C: Math.round(weatherData.current.temperature_2m),
        humidity: weatherData.current.relative_humidity_2m,
        pressure: Math.round(weatherData.current.surface_pressure),
        visibility: Math.round(weatherData.current.visibility / 1000),
        FeelsLikeC: Math.round(weatherData.current.apparent_temperature),
        windSpeed: Math.round(weatherData.current.wind_speed_10m),
        weatherDesc: [{ value: getWeatherDescription(weatherData.current.weather_code) }],
      }],
      weather: weatherData.daily.time.slice(0, 3).map((date, index) => ({
        date: date,
        maxtempC: Math.round(weatherData.daily.temperature_2m_max[index]),
        mintempC: Math.round(weatherData.daily.temperature_2m_min[index]),
        hourly: [{
          weatherDesc: [{ value: getWeatherDescription(weatherData.daily.weather_code[index]) }],
          humidity: weatherData.current.relative_humidity_2m,
          chanceofrain: weatherData.daily.precipitation_probability_max[index] || 0,
        }],
      })),
      location: {
        name: name,
        latitude: latitude,
        longitude: longitude,
      }
    };

    return {
      success: true,
      data: transformedData,
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    
    // Возвращаем более детальную информацию об ошибке
    if (error.message.includes('404') || error.message.includes('Город не найден')) {
      return {
        success: false,
        error: 'Город не найден. Проверьте правильность написания.',
      };
    } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Проблемы с сетью. Проверьте подключение к интернету.',
      };
    } else {
      return {
        success: false,
        error: 'Не удалось получить данные о погоде. Попробуйте позже.',
      };
    }
  }
};

// Альтернативный API на случай проблем с основным
export const getWeatherDataAlternative = async (city) => {
  try {
    // Используем wttr.in как резервный вариант
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=ru`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WeatherApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Город не найден');
    }

    const data = await response.json();
    
    if (!data.current_condition || !data.weather) {
      throw new Error('Некорректные данные от сервера');
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Функция для преобразования кодов погоды в описания
const getWeatherDescription = (code) => {
  const weatherCodes = {
    0: 'Ясно',
    1: 'Преимущественно ясно',
    2: 'Переменная облачность',
    3: 'Пасмурно',
    45: 'Туман',
    48: 'Изморозь',
    51: 'Легкая морось',
    53: 'Умеренная морось',
    55: 'Сильная морось',
    56: 'Легкая ледяная морось',
    57: 'Сильная ледяная морось',
    61: 'Легкий дождь',
    63: 'Умеренный дождь',
    65: 'Сильный дождь',
    66: 'Легкий ледяной дождь',
    67: 'Сильный ледяной дождь',
    71: 'Легкий снег',
    73: 'Умеренный снег',
    75: 'Сильный снег',
    77: 'Снежные зерна',
    80: 'Легкие ливни',
    81: 'Умеренные ливни',
    82: 'Сильные ливни',
    85: 'Легкие снежные ливни',
    86: 'Сильные снежные ливни',
    95: 'Гроза',
    96: 'Гроза с легким градом',
    99: 'Гроза с сильным градом',
  };
  return weatherCodes[code] || 'Неизвестно';
};