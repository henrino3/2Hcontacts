import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainNavigator } from './src/navigation/MainNavigator';
import { LoadingScreen } from './src/components/LoadingScreen';
import { View } from 'react-native';

const queryClient = new QueryClient();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls, etc.
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated loading time
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    }

    prepare();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
} 