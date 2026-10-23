/**
 * @format
 */
import 'react-native-url-polyfill/auto';
import { AppRegistry } from 'react-native';
import App from './App';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { store } from './src/Redux';
import { name as appName } from './app.json';
if (__DEV__) {
  require("./ReactotronConfig");
}

const Root = () => (
  <Provider store={store}>
    <SafeAreaProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SafeAreaProvider>
  </Provider>
);

AppRegistry.registerComponent(appName, () => Root);
