import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isLoading: boolean;
  isDarkMode: boolean;
  notifications: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }[];
  sideMenuOpen: boolean;
}

const initialState: UIState = {
  isLoading: false,
  isDarkMode: false,
  notifications: [],
  sideMenuOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    addNotification: (
      state,
      action: PayloadAction<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>
    ) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((notif) => notif.id !== action.payload);
    },
    toggleSideMenu: (state) => {
      state.sideMenuOpen = !state.sideMenuOpen;
    },
    setSideMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.sideMenuOpen = action.payload;
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setLoading,
  toggleDarkMode,
  setDarkMode,
  addNotification,
  removeNotification,
  toggleSideMenu,
  setSideMenuOpen,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
