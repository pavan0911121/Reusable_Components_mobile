import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Eye, EyeOff } from 'lucide-react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import supabase from '../../../supabase';
import { useAppDispatch } from '../../Redux/hooks';
import { loginSuccess, register } from '../../Redux/slices/loginSlice';
import * as AsyncStore from '../../AsyncStore';
import type { AuthStackParamList } from '../../types/navigation';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

type RegisterField = keyof RegisterForm;

const googleIcon = require('../../assets/google.png');

const RegisterScreen: React.FC = () => {
  const [form, setForm] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<RegisterField, string>>>({});
  const [registerError, setRegisterError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleConfigInitialized, setGoogleConfigInitialized] = useState(false);
  const navigation = useNavigation<RegisterNavigationProp>();
  const dispatch = useAppDispatch();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isFormValid =
    isEmailValid &&
    form.password.length >= 6 &&
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;

  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      try {
        GoogleSignin.configure({
          webClientId: '324782344898-mgb6fu485atk1ro9foj5muoreudk6de9.apps.googleusercontent.com',
          iosClientId: '324782344898-g7jhmhl3q5k5pg0p2rlnbcvvchj2m1st.apps.googleusercontent.com',
          offlineAccess: false,
          forceCodeForRefreshToken: true,
        });
        setGoogleConfigInitialized(true);
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        setRegisterError('Google Sign-In could not be initialized.');
      }
    };

    initializeGoogleSignIn();
  }, []);

  const updateField = (field: RegisterField, value: string) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    setErrors(current => {
      const nextErrors = { ...current };

      if (field === 'email') {
        nextErrors.email = !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? undefined
          : 'Please enter a valid email';
      }

      if (field === 'password') {
        nextErrors.password = !value || value.length >= 6
          ? undefined
          : 'Password must be at least 6 characters';
        nextErrors.confirmPassword = !updatedForm.confirmPassword ||
          value === updatedForm.confirmPassword
          ? undefined
          : 'Passwords do not match';
      }

      if (field === 'confirmPassword') {
        nextErrors.confirmPassword = !value || value === updatedForm.password
          ? undefined
          : 'Passwords do not match';
      }

      return nextErrors;
    });
    setRegisterError('');
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<RegisterField, string>> = {};
    const email = form.email.trim();

    if (!email) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Please enter a valid email';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setRegisterError('');
    setIsLoading(true);
    try {
      await dispatch(register({
        email: form.email.trim(),
        password: form.password,
      })).unwrap();
      navigation.navigate('Login');
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Unable to create your account. Please try again.';
      setRegisterError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setRegisterError('');
    setIsLoading(true);
    try {
      if (!googleConfigInitialized) {
        setRegisterError('Google Sign-In is initializing. Please try again.');
        return;
      }

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type !== 'success') {
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In did not return an ID token.');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) {
        throw error;
      }
      if (!data.session) {
        throw new Error('Google Sign-In did not create a session.');
      }

      const { user } = data.session;
      const email = user.email ?? '';
      const appUser = {
        id: user.id,
        email,
        name: email ? email.split('@')[0] : 'User',
        role: 'user',
      };
      await AsyncStore.storeData(AsyncStore.Keys.USER_TOKEN, data.session.access_token);
      await AsyncStore.storeData(AsyncStore.Keys.REFRESH_TOKEN, data.session.refresh_token);
      await AsyncStore.storeData(AsyncStore.Keys.IS_LOGIN, 'true');
      await AsyncStore.storeData(AsyncStore.Keys.USER_DATA, JSON.stringify(appUser));
      dispatch(loginSuccess({
        user: appUser,
        token: data.session.access_token,
        isAuthenticated: true,
      }));
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        if (error.code === statusCodes.IN_PROGRESS) {
          setRegisterError('Sign in already in progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setRegisterError('Google Play Services not available or outdated');
        } else {
          console.error('Google Sign-In Error:', error);
          setRegisterError('Google Sign-In failed. Please try again.');
        }
      } else {
        console.error('Google Sign-In Error:', error);
        setRegisterError(error instanceof Error
          ? error.message
          : 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordField = (
    field: 'password' | 'confirmPassword',
    label: string,
    visible: boolean,
    toggleVisibility: () => void,
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholder="****************"
          placeholderTextColor="#929292"
          value={form[field]}
          onChangeText={value => updateField(field, value)}
          secureTextEntry={!visible}
          autoCapitalize="none"
          editable={!isLoading}
          accessibilityLabel={label}
        />
        <TouchableOpacity
          onPress={toggleVisibility}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible
            ? <EyeOff size={19} color="#777" />
            : <Eye size={19} color="#777" />}
        </TouchableOpacity>
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            Let’s <Text style={styles.titleAccent}>Sign you up</Text>,
          </Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email address</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="septa.git@gmail.com"
                placeholderTextColor="#929292"
                value={form.email}
                onChangeText={value => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                accessibilityLabel="Email address"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {renderPasswordField(
            'password',
            'Password',
            showPassword,
            () => setShowPassword(current => !current),
          )}
          {renderPasswordField(
            'confirmPassword',
            'Confirm Password',
            showConfirmPassword,
            () => setShowConfirmPassword(current => !current),
          )}

          {registerError ? (
            <View style={styles.errorMessageContainer}>
              <Text style={styles.errorMessageText}>{registerError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, (!isFormValid || isLoading) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isFormValid || isLoading }}
          >
            {isLoading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.submitButtonText}>SIGN Up</Text>}
          </TouchableOpacity>

          <Text style={styles.agreementText}>
            By signing up, you have agreed to our{'\n'}
            <Text style={styles.termsLink}>Terms and conditions</Text>
            <Text style={styles.agreementSeparator}> &amp; </Text>
            <Text style={styles.termsLink}>Privacy policy</Text>
          </Text>

          <Text style={styles.dividerText}>Or</Text>

          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading || !googleConfigInitialized}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Image source={googleIcon} style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Connect with Google</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 9,
    paddingBottom: 16,
  },
  title: {
    color: '#171717',
    fontFamily: 'Poppins-Medium',
    fontSize: 23,
    lineHeight: 33,
    marginBottom: 9,
  },
  titleAccent: {
    color: '#EF3E36',
    fontFamily: 'Poppins-Medium',
  },
  fieldContainer: {
    marginVertical : 11,
  },
  label: {
    color: '#171717',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    borderColor: '#DCDCDC',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 15,
  },
  inputError: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF4444',
  },
  input: {
    color: '#222222',
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    paddingVertical: 0,
  },
  errorText: {
    color: '#FF4444',
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    marginTop: 5,
  },
  errorMessageContainer: {
    backgroundColor: '#FFF5F5',
    borderLeftColor: '#FF4444',
    borderLeftWidth: 4,
    borderRadius: 6,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorMessageText: {
    color: '#D92D20',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  submitButton: {
    height: 54,
    marginHorizontal: 0,
    backgroundColor: '#3B1D0B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
  },
  agreementText: {
    color: '#999999',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 9,
    textAlign: 'center',
  },
  termsLink: {
    color: '#1853E9',
  },
  agreementSeparator: {
    color: '#999999',
  },
  dividerText: {
    color: '#111111',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginBottom: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  googleButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#A8A8A8',
    borderRadius: 8,
    borderWidth: 2,
    flexDirection: 'row',
    height: 54,
    justifyContent: 'center',
    width: '100%',

  },
  googleIcon: {
    height: 25,
    marginRight: 9,
    width: 25,
  },
  googleButtonText: {
    color: '#111111',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
});
