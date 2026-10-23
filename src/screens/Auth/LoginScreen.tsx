import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation';
import { useNavigation } from '@react-navigation/native';
import { loginSuccess, postUserData } from '../../Redux/slices/loginSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../Redux';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import supabase from '../../../supabase';
import { useEffect } from 'react';
import * as AsyncStore from '../../AsyncStore';
import { Eye, EyeOff } from 'lucide-react-native';


const googleIcon = require('../../assets/google.png');

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginForm {
  email: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  // const { login, isLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [loginError, setLoginError] = useState<string>('');
  const [googleConfigInitialized, setGoogleConfigInitialized] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();



  // Initialize Google Sign-In configuration once on component mount
  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      try {
        GoogleSignin.configure({
          webClientId: '324782344898-mgb6fu485atk1ro9foj5muoreudk6de9.apps.googleusercontent.com',
          iosClientId: '324782344898-g7jhmhl3q5k5pg0p2rlnbcvvchj2m1st.apps.googleusercontent.com',
          offlineAccess: false,
          forceCodeForRefreshToken: true,
        });

        // Sign out first to ensure clean state on first attempt
        try {
          await GoogleSignin.signOut();
        } catch (signOutError) {
          // Ignore error if user wasn't signed in
        }

        setGoogleConfigInitialized(true);
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        setGoogleConfigInitialized(true); // Still set to true to allow retry
      }
    };

    initializeGoogleSignIn();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleValidation = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!handleValidation()) {
      return;
    }
    try {
      setLoginError('');
      setIsLoading(true);

      const data = {
        email: form.email,
        password: form.password,
      };

      const result = await dispatch(postUserData(data) as any);

    } catch (error) {
      setLoginError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoginError('');
      setIsLoading(true);

      // Ensure Google Sign-In is initialized before proceeding
      if (!googleConfigInitialized) {
        setLoginError('Google Sign-In is initializing. Please try again.');
        setIsLoading(false);
        return;
      }

      // Check for Play Services availability
      try {
        await GoogleSignin.hasPlayServices()
        const response = await GoogleSignin.signIn()
        if (response?.type === 'success') {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.data.idToken as string,
          })

          if (error) {
            setLoginError(error.message || 'Authentication failed');
            setIsLoading(false);
            return;
          }

          if (data?.session?.access_token) {
            // Store token and login status
            await AsyncStore.storeData(AsyncStore.Keys.USER_TOKEN, data?.session?.access_token);
            await AsyncStore.storeData(AsyncStore.Keys.REFRESH_TOKEN, data?.session?.refresh_token);
            await AsyncStore.storeData(AsyncStore.Keys.IS_LOGIN, "true");
            await AsyncStore.storeData(AsyncStore.Keys.USER_DATA, JSON.stringify(data?.session?.user));

            const sessionUser = data?.session?.user;
            const sessionEmail = sessionUser?.email ?? '';
            const userWithName = {
              ...sessionUser,
              email: sessionEmail,
              name: sessionEmail ? sessionEmail.split('@')[0] : 'User',
            };

            dispatch(loginSuccess({
              user: userWithName as any,
              token: data?.session?.access_token,
              isAuthenticated: true,
            }) as any);

            // Store user data
            if (data?.user) {
              await AsyncStore.storeData(AsyncStore.Keys.USER_DATA, JSON.stringify(data.user));
            }
          }

          // App.tsx detects Redux state changes and updates navigation.
        }
      } catch (error: any) {
        if (error.code === statusCodes.IN_PROGRESS) {
          setLoginError('Sign in already in progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setLoginError('Google Play Services not available or outdated');
        } else {
          setLoginError('Google Sign-In failed. Please try again.');
          console.error('Google Sign-In Error:', error);
        }
      }

    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      setLoginError('Google Sign-In failed. Please ensure your device has internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };
const handleRegisterNavigation = () => {
    navigation.navigate('Register');
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>
              Welcome to <Text style={styles.brandText}>SAMAGRI</Text>
            </Text>
            <Text style={styles.subtitleText}>
              If you don't have an account{'\n'}please{' '}
              <Text
                style={styles.signUpLinkText}
                onPress={() => handleRegisterNavigation()}
                accessibilityRole="link"
              >
                Sign up here
              </Text>
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email address</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.email ? styles.inputError : null,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="user@gmail.com"
                  placeholderTextColor="#929292"
                  value={form.email}
                  onChangeText={(text) => {
                    setForm({ ...form, email: text });
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password ? styles.inputError : null,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="****************"
                  placeholderTextColor="#929292"
                  value={form.password}
                  onChangeText={(text) => {
                    setForm({ ...form, password: text });
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((isVisible) => !isVisible)}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={19} color="#777" />
                  ) : (
                    <Eye size={19} color="#777" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot password ?</Text>
              </TouchableOpacity>
            </View>

            {loginError && (
              <View style={styles.errorMessageContainer}>
                <Text style={styles.errorMessageText}>{loginError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>SIGN IN</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <Text style={styles.dividerText}>Or</Text>
            </View>

            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              disabled={isLoading || !googleConfigInitialized}
              activeOpacity={0.7}
              onPress={handleGoogleSignIn}
            >
              <Image
                source={googleIcon}
                style={styles.googleButtonIcon}
              />
              <Text style={styles.googleButtonText}>
                {!googleConfigInitialized ? 'Initializing...' : 'Connect with Google'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContainer: {
    marginTop: 12,
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#34343E',
    lineHeight: 30,
  },
  brandText: {
    color: '#EF3E36',
  },
  subtitleText: {
    marginTop: 32,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#606783',
    lineHeight: 24,
  },
  signUpLinkText: {
    color: '#EF3E36',
  },
  formCard: {
    backgroundColor: '#FFF',
    paddingHorizontal: 7,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#171717',
    marginBottom: 9,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#E8E8E8',
  },
  inputError: {
    borderColor: '#FF4444',
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#222',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#FF4444',
    marginTop: 6,
  },
  errorMessageContainer: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderRadius: 6,
  },
  errorMessageText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#FF4444',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -1,
    marginBottom: 42,
  },
  forgotPasswordText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#0088D7',
  },
  loginButton: {
    height: 54,
    marginHorizontal: 11,
    backgroundColor: '#3B1D0B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
  },
  dividerContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  dividerText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#111',
  },
  socialButton: {
    height: 54,
    borderWidth: 2,
    borderColor: '#A8A8A8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFF',
    gap: 9,
    marginBottom: 16,
  },
  googleButtonIcon: {
    width: 25,
    height: 25,
  },
  socialButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111',
  },
  googleButton: {
    marginHorizontal: 11,
    marginBottom: 0,
  },
  googleButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111',
  },
  // Footer Styles
  footerContainer: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  agreementText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  footerLink: {
    fontSize: 12,
    color: '#1853E9',
    fontFamily: 'Poppins-Regular',
  },
  footerLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 20,
  },
  footerLinkItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#1853E9',
    textDecorationLine: 'none',
  },
  copyrightText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#CCC',
    textAlign: 'center',
  },
});

export default LoginScreen;
