import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWeatherData, getWeatherDataAlternative, searchCities } from '../services/weatherApi';

export default function HomeScreen({ onWeatherSearch }) {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    // Очищаем предыдущий таймер
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Если поле пустое, скрываем подсказки
    if (!city.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Устанавливаем новый таймер для поиска
    searchTimeoutRef.current = setTimeout(async () => {
      if (city.length >= 2) {
        setSearchLoading(true);
        const result = await searchCities(city);
        if (result.success) {
          setSuggestions(result.data);
          setShowSuggestions(result.data.length > 0);
        }
        setSearchLoading(false);
      }
    }, 300); // Задержка 300мс

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [city]);

  const searchWeather = async (selectedCity = null) => {
    const cityToSearch = selectedCity || city.trim();
    
    if (!cityToSearch) {
      Alert.alert('Ошибка', 'Пожалуйста, введите название города');
      return;
    }

    setLoading(true);
    setShowSuggestions(false);
    Keyboard.dismiss();

    try {
      // Сначала пробуем основной API
      let result = await getWeatherData(cityToSearch);
      
      // Если основной API не сработал, пробуем альтернативный
      if (!result.success) {
        console.log('Основной API не сработал, пробуем альтернативный...');
        result = await getWeatherDataAlternative(cityToSearch);
      }

      if (result.success) {
        onWeatherSearch({ 
          city: result.data.location?.name || cityToSearch, 
          data: result.data 
        });
      } else {
        Alert.alert('Ошибка', result.error);
      }
    } catch (error) {
      console.error('Search Weather Error:', error);
      Alert.alert('Ошибка', 'Произошла неожиданная ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setCity(suggestion.name);
    setShowSuggestions(false);
    searchWeather(suggestion.name);
  };

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <View style={styles.suggestionContent}>
        <Ionicons name="location-outline" size={16} color="#93c5fd" style={styles.suggestionIcon} />
        <View style={styles.suggestionTextContainer}>
          <Text style={styles.suggestionCityName}>{item.name}</Text>
          <Text style={styles.suggestionCountry}>({item.country})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestions = () => {
    if (!showSuggestions) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSuggestionItem}
          style={styles.suggestionsList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={searchLoading && (
            <View style={styles.suggestionLoader}>
              <ActivityIndicator color="#93c5fd" size="small" />
              <Text style={styles.loadingText}>Поиск городов...</Text>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Прогноз погоды</Text>
          <Text style={styles.subtitle}>Узнайте погоду в вашем городе</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Введите название города"
              placeholderTextColor="#93c5fd"
              value={city}
              onChangeText={setCity}
              onSubmitEditing={() => searchWeather()}
              editable={!loading}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={[styles.searchButton, loading && styles.searchButtonDisabled]}
              onPress={() => searchWeather()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="search" size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
          {renderSuggestions()}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by VANSOFT 2025</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#93c5fd',
    textAlign: 'center',
  },
  searchContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 350,
  },
  input: {
    flex: 1,
    height: 55,
    backgroundColor: '#3730a3',
    borderRadius: 27.5,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  searchButton: {
    width: 55,
    height: 55,
    backgroundColor: '#3b82f6',
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 65,
    maxHeight: 200,
    backgroundColor: '#3730a3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4f46e5',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4f46e5',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionCityName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  suggestionCountry: {
    fontSize: 14,
    color: '#93c5fd',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  suggestionLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    color: '#93c5fd',
    marginLeft: 8,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: '#93c5fd',
    fontSize: 12,
  },
});