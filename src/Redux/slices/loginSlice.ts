import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import client from '../../Networking/Client';
import { AUTH_ENDPOINTS, } from '../../Networking/EndPoints';
import * as AsyncStore from "../../AsyncStore";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  deviceInfoPosted: boolean;
  isVerified?: boolean;
  role?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  mobileNumber?: string | null;
  experienceLevel?: string | null;
  currentRole?: string | null;
  preferredLocation?: string | null;
  userId: string | null;
  errorUserData?: string | null;
  errorCode: string | null;
  refreshToken?: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
  deviceInfoPosted: false,
  isVerified: false,
  role: null,
  firstName: null,
  lastName: null,
  email: null,
  mobileNumber: null,
  experienceLevel: null,
  currentRole: null,
  preferredLocation: null,
  userId: null,
  errorUserData: null,
  errorCode: null,
  refreshToken: null,

};
//Login API call
export const postUserData = createAsyncThunk(
  "login/postUserData",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await client.post(AUTH_ENDPOINTS.login, payload);
      return response.data || response;
    } catch (error: any) {
      console.log('Error posting user data:', error);
      return rejectWithValue({
        message: error?.message || 'Failed to post user data',
        code: error?.code || 'ERROR',
      });
    }
  }
);

//Check email API call
export const checkEmail = createAsyncThunk(
  "login/checkEmail",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await client.get(AUTH_ENDPOINTS.checkEmail(email));
      return response.data || response;
    } catch (error: any) {
      console.error('Error checking email:', error);
      return rejectWithValue({
        message: error?.message || 'Failed to check email',
        code: error?.code || 'ERROR',
      });
    }
  }
);
//Register Job Seeker Api
export const register = createAsyncThunk(
  "login/register",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await client.post(AUTH_ENDPOINTS.register, payload);
      return response.data || response;
    } catch (error: any) {
      console.error('Error registering job seeker:', error);
      return rejectWithValue({
        message: error?.message || 'Failed to register job seeker',
        code: error?.code || 'ERROR',
      });
    }
  }
);
//refreshtoken API call
export const refreshToken = createAsyncThunk(
  "login/refreshToken",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await client.post(AUTH_ENDPOINTS.refreshToken, payload);
      return response.data || response;
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      return rejectWithValue({
        message: error?.message || 'Failed to refresh token',
        code: error?.code || 'ERROR',
      });
    }
  }
);
//recoveryCode API call
export const recoveryCode = createAsyncThunk(
  "login/recoveryCode",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await client.post(AUTH_ENDPOINTS.recoveryCode, payload);
      return response.data || response;
    } catch (error: any) {
      console.error('Error sending recovery code:', error);
      return rejectWithValue({
        message: error?.message || 'Failed to send recovery code',
        code: error?.code || 'ERROR',
      });
    }
  }
);

//verifyRecoveryCode API call
export const verifyRecoveryCode = createAsyncThunk(
  "login/verifyRecoveryCode",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await client.post(AUTH_ENDPOINTS.verifyRecoveryCode, payload);
      return response.data || response;
    } catch (error: any) {
      console.error('Error verifying recovery code:', error);
      return rejectWithValue({
        message: error?.message || 'Failed to verify recovery code',
        code: error?.code || 'ERROR',
      });
    }
  }
);

//resetPassword API call
export const resetPassword = createAsyncThunk(
  "login/resetPassword",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await client.post(AUTH_ENDPOINTS.resetPassword, payload);
      return response.data || response;
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return rejectWithValue({
        message: error?.message || 'Failed to reset password',
        code: error?.code || 'ERROR',
      });
    }
  }
);


const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string, isAuthenticated: boolean }>) => {
      state.isLoading = false;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateUserData: (state, action: PayloadAction<{ firstName?: string; lastName?: string; email?: string; mobileNumber?: string }>) => {
      state.firstName = action.payload.firstName || null;
      state.lastName = action.payload.lastName || null;
      state.email = action.payload.email || null;
      state.mobileNumber = action.payload.mobileNumber || null;
    },
    updateExperience: (state, action: PayloadAction<{ experienceLevel?: string; currentRole?: string; preferredLocation?: string }>) => {
      state.experienceLevel = action.payload.experienceLevel || null;
      state.currentRole = action.payload.currentRole || null;
      state.preferredLocation = action.payload.preferredLocation || null;
    },
    clearUserData: (state) => {
      state.firstName = null;
      state.lastName = null;
      state.email = null;
      state.mobileNumber = null;
      state.experienceLevel = null;
      state.currentRole = null;
      state.preferredLocation = null;
      state.role = null;
      state.isVerified = false;
      state.user = null;
      state.userId = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.deviceInfoPosted = false;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // postUserData async thunk handlers
      .addCase(postUserData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(postUserData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deviceInfoPosted = true;
        state.error = null;
        const dataObj = action.payload;

        // Extract token - check multiple possible field names
        const token = dataObj?.access_token || dataObj?.token;
        if (token) {
          state.token = token;
          state.isAuthenticated = true;
          state.refreshToken = dataObj?.refresh_token;
          AsyncStore.storeData(AsyncStore.Keys.USER_TOKEN, token);
          AsyncStore.storeData(AsyncStore.Keys.IS_LOGIN, "true");
        }
        const refreshToken = dataObj?.refresh_token;
        if (refreshToken) {
          state.refreshToken = refreshToken;
          console.log('dataObj?.refresh_token:', refreshToken);
          AsyncStore.storeData(AsyncStore.Keys.REFRESH_TOKEN, refreshToken);
        }

        // Extract user data - check multiple possible field names
        const user = dataObj?.user || dataObj?.data?.user;
        if (user) {
          state.user = user;
          AsyncStore.storeData(AsyncStore.Keys.USER_DATA, JSON.stringify(user));
        }

        // If we have a token, consider login successful
        if (token) {
          state.isAuthenticated = true;
        }
      })
      .addCase(postUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.deviceInfoPosted = false;
        state.error = (action.payload as any)?.message || 'Failed to post user data';

        // If no token error, logout the user
        // if ((action.payload as any)?.code === 'NO_TOKEN') {
        //   state.isAuthenticated = false;
        //   state.token = null;
        //   state.user = null;
        // }
      })
    // checkEmail async thunk handlers
    builder
      .addCase(checkEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Handle email check response if needed
      })
      .addCase(checkEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to check email';
      });
    // register async thunk handlers
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Handle job seeker registration response if needed
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to register job seeker';
      });
    // refreshToken async thunk handlers
    builder
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        const newToken = action.payload?.access_token || action.payload?.token;
        if (newToken) {
          state.token = newToken;
          AsyncStore.storeData(AsyncStore.Keys.USER_TOKEN, newToken);
          console.log('Refresh token value from loginSlice:', action?.payload?.refresh_token);
          AsyncStore.storeData(AsyncStore.Keys.REFRESH_TOKEN, action?.payload?.refresh_token);
        }
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to refresh token';
      });
      // recoveryCode async thunk handlers
      builder
      .addCase(recoveryCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(recoveryCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(recoveryCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to send recovery code';
      });
      // verifyRecoveryCode async thunk handlers
      builder
      .addCase(verifyRecoveryCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyRecoveryCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyRecoveryCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to verify recovery code';
      });
      // resetPassword async thunk handlers
      builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.message || 'Failed to reset password';
      });
  }
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserProfile,
  clearError,
  updateUserData,
  updateExperience,
  clearUserData
} = loginSlice.actions;

export default loginSlice.reducer;
