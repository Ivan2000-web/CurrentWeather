import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import WeatherScreen from './src/screens/WeatherScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    // Показываем splash screen на 2 секунды
    const timer = setTimeout(() => {
      setCurrentScreen('home');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleWeatherSearch = (data) => {
    setWeatherData(data);
    setCurrentScreen('weather');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setWeatherData(null);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'home':
        return <HomeScreen onWeatherSearch={handleWeatherSearch} />;
      case 'weather':
        return <WeatherScreen weatherData={weatherData} onBack={handleBackToHome} />;
      default:
        return <HomeScreen onWeatherSearch={handleWeatherSearch} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1e3a8a" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
});