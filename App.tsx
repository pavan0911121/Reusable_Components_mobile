/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, AppState, Text, Button, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
// import InAppUpdateChecker from './src/components/InAppUpdateChecker';
import { useSelector, useDispatch } from 'react-redux';
import * as AsyncStore from "./src/AsyncStore";
import { loginSuccess, clearUserData } from './src/Redux/slices/loginSlice';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  // const [startupError, setStartupError] = useState(false);
  const [startupAttempt, setStartupAttempt] = useState(0);
  const selector = useSelector((state: any) => state.login);
  const dispatch = useDispatch();
  const isLoggedIn = selector?.isAuthenticated;

  const loadStoredSession = useCallback(async () => {
    const [token, userData, isLogin] = await Promise.all([
      AsyncStore.getData(AsyncStore.Keys.USER_TOKEN),
      AsyncStore.getData(AsyncStore.Keys.USER_DATA),
      AsyncStore.getData(AsyncStore.Keys.IS_LOGIN),
    ]);
    if (token && isLogin === 'true') {
      const user = userData ? JSON.parse(userData) : null;
      dispatch(loginSuccess({ user, token, isAuthenticated: true }));
    } else {
      dispatch(clearUserData());
    }
  }, [dispatch]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let mounted = true;
    // setStartupError(false);

    const initializeSession = async () => {
      if (!mounted) {
        return;
      }
      await loadStoredSession();
      if (!mounted) {
        return;
      }
      setAuthReady(true);
      timeout = setTimeout(() => setShowSplash(false), 1400);
    };

    initializeSession().catch(() => {
      // if (mounted) {
      //   setStartupError(true);
      // }
    });

    return () => {
      mounted = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [dispatch, loadStoredSession, startupAttempt]);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    const sub = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        loadStoredSession().catch(() => console.warn('Unable to restore stored session'));
      }
    });
    return () => sub.remove();
  }, [authReady, loadStoredSession]);

  // if (startupError) {
  //   return (
  //     <>
  //       <InAppUpdateChecker />
  //       <View style={styles.centered}>
  //         <Text>Unable to connect. Please try again.</Text>
  //         <Button title="Retry" onPress={() => setStartupAttempt(attempt => attempt + 1)} />
  //       </View>
  //     </>
  //   );
  // }

  // if (showSplash) {
  //   return (
  //     <>
  //       <InAppUpdateChecker />
  //       <StatusBar barStyle="dark-content" />
  //       <SplashScreen />
  //     </>
  //   );
  // }
  return (
    <>
      {/* <InAppUpdateChecker /> */}
      {/* <StatusBar barStyle="dark-content" /> */}
      <AppNavigator isUserLoggedIn={isLoggedIn} />

    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default App;
