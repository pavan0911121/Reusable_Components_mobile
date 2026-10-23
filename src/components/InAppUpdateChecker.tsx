import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';

const inAppUpdates = new SpInAppUpdates(false);

function InAppUpdateChecker() {
  const isChecking = useRef(false);

  useEffect(() => {
    let currentAppState = AppState.currentState;

    const checkForUpdate = async () => {
      if (isChecking.current) {
        return;
      }

      isChecking.current = true;
      try {
        const result = await inAppUpdates.checkNeedsUpdate();
        if (result.shouldUpdate) {
          const updateOptions: StartUpdateOptions =
            Platform.OS === 'android'
              ? { updateType: IAUUpdateKind.IMMEDIATE }
              : {
                  title: 'Update available',
                  message: 'A new version is available. Update now?',
                  buttonUpgradeText: 'Update now',
                  buttonCancelText: 'Later',
                };

          await inAppUpdates.startUpdate(updateOptions);
        }
      } catch (error) {
        console.error('In-app update failed:', error);
      } finally {
        isChecking.current = false;
      }
    };

    checkForUpdate();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (currentAppState !== 'active' && nextAppState === 'active') {
        checkForUpdate();
      }
      currentAppState = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  return null;
}

export default InAppUpdateChecker;