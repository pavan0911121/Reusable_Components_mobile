export { store } from './Store';
export type { RootState, AppDispatch } from './Store';
export { useAppDispatch, useAppSelector } from './hooks';

// Auth slice exports
export {
  postUserData,
  // getRole,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserProfile,
  clearError,
} from './slices/loginSlice';

// UI slice exports
export {
  setLoading,
  toggleDarkMode,
  setDarkMode,
  addNotification,
  removeNotification,
  toggleSideMenu,
  setSideMenuOpen,
  clearNotifications,
} from './slices/uiSlice';
