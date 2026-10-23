import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
    useWindowDimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useAppDispatch } from '../../Redux/hooks';
import {
    recoveryCode,
    resetPassword as resetPasswordRequest,
    verifyRecoveryCode,
} from '../../Redux/slices/loginSlice';
import type { AuthStackParamList } from '../../types/navigation';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
type RecoveryStep = 1 | 2 | 3;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getRequestErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String(error.message);
    }
    return fallback;
};

const getResetToken = (response: unknown): string | null => {
    if (typeof response !== 'object' || response === null) {
        return null;
    }

    if ('resetToken' in response && typeof response.resetToken === 'string') {
        return response.resetToken;
    }

    if ('data' in response && typeof response.data === 'object' && response.data !== null &&
        'resetToken' in response.data && typeof response.data.resetToken === 'string') {
        return response.data.resetToken;
    }

    return null;
};

const ForgotPassword: React.FC = () => {
    const navigation = useNavigation<ForgotPasswordNavigationProp>();
    const dispatch = useAppDispatch();
    const { width: screenWidth } = useWindowDimensions();
    const [step, setStep] = useState<RecoveryStep>(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [activeAction, setActiveAction] = useState<'send' | 'resend' | 'verify' | 'reset' | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [resendSeconds, setResendSeconds] = useState(0);
    const contentTranslation = useRef(new Animated.Value(0)).current;
    const isLoading = activeAction !== null;

    useEffect(() => {
        if (step !== 2 || resendSeconds <= 0) {
            return;
        }

        const timer = setTimeout(() => setResendSeconds(seconds => seconds - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendSeconds, step]);

    const transitionTo = (nextStep: RecoveryStep) => {
        const direction = nextStep > step ? 1 : -1;
        setErrorMessage('');
        setIsTransitioning(true);

        Animated.timing(contentTranslation, {
            toValue: direction * -screenWidth,
            duration: 150,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (!finished) {
                setIsTransitioning(false);
                return;
            }

            setStep(nextStep);
            contentTranslation.setValue(direction * screenWidth);
            requestAnimationFrame(() => {
                Animated.timing(contentTranslation, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }).start(() => setIsTransitioning(false));
            });
        });
    };

    const handleBack = () => {
        if (isLoading || isTransitioning) {
            return;
        }
        if (step === 1) {
            navigation.goBack();
        } else {
            transitionTo((step - 1) as RecoveryStep);
        }
    };

    const handleSendCode = async () => {
        const normalizedEmail = email.trim();
        if (!emailPattern.test(normalizedEmail)) {
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        setActiveAction('send');
        setErrorMessage('');
        try {
            await dispatch(recoveryCode({ email: normalizedEmail })).unwrap();
            setResendSeconds(60);
            transitionTo(2);
        } catch (error) {
            console.error('Unable to send password recovery code:', error);
            setErrorMessage(getRequestErrorMessage(error, 'Unable to send the reset code. Please try again.'));
        } finally {
            setActiveAction(null);
        }
    };

    const handleResendCode = async () => {
        if (resendSeconds > 0 || isLoading) {
            return;
        }

        setActiveAction('resend');
        setErrorMessage('');
        try {
            await dispatch(recoveryCode({ email: email.trim() })).unwrap();
            setResendSeconds(60);
        } catch (error) {
            console.error('Unable to resend password recovery code:', error);
            setErrorMessage(getRequestErrorMessage(error, 'Unable to resend the code. Please try again.'));
        } finally {
            setActiveAction(null);
        }
    };

    const handleVerifyCode = async () => {
        const normalizedCode = code.trim();
        if (!normalizedCode) {
            setErrorMessage('Please enter the code sent to your email.');
            return;
        }

        setActiveAction('verify');
        setErrorMessage('');
        try {
            const result = await dispatch(verifyRecoveryCode({
                email: email.trim(),
                recoveryCode: normalizedCode,
            })).unwrap();
            
            const verifiedResetToken = getResetToken(result);
            if (!verifiedResetToken) {
                setErrorMessage('The verification response did not include a reset token. Please try again.');
                return;
            }
            setResetToken(verifiedResetToken);
            transitionTo(3);
        } catch (error) {
            console.error('Unable to verify password recovery code:', error);
            setErrorMessage(getRequestErrorMessage(error, 'Unable to verify the code. Please try again.'));
        } finally {
            setActiveAction(null);
        }
    };

    const handleResetPassword = async () => {
        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setActiveAction('reset');
        setErrorMessage('');
        try {
            await dispatch(resetPasswordRequest({
                resetToken,
                password,
            })).unwrap();

            Alert.alert('Password reset', 'Your password has been updated. Please sign in with your new password.', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('Login'),
                },
            ]);
        } catch (error) {
            console.error('Unable to update password:', error);
            setErrorMessage(getRequestErrorMessage(error, 'Unable to reset your password. Please try again.'));
        } finally {
            setActiveAction(null);
        }
    };

    const renderPasswordField = (
        label: string,
        value: string,
        visible: boolean,
        onChangeText: (text: string) => void,
        onToggleVisibility: () => void,
    ) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder="****************"
                    placeholderTextColor="#929292"
                    value={value}
                    onChangeText={text => {
                        onChangeText(text);
                        setErrorMessage('');
                    }}
                    secureTextEntry={!visible}
                    autoCapitalize="none"
                    editable={!isLoading}
                    accessibilityLabel={label}
                />
                <TouchableOpacity
                    onPress={onToggleVisibility}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                >
                    {visible ? <EyeOff size={19} color="#777777" /> : <Eye size={19} color="#777777" />}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <Text style={styles.title}>Reset Code</Text>
                        <Text style={styles.description}>
                            Enter your email address and we will{'\n'}send you the reset code
                        </Text>

                        <View style={styles.firstStepField}>
                            <Text style={styles.label}>Email address</Text>
                            <TextInput
                                style={styles.singleInput}
                                placeholder="septa.git@gmail.com"
                                placeholderTextColor="#929292"
                                value={email}
                                onChangeText={text => {
                                    setEmail(text);
                                    setErrorMessage('');
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                                accessibilityLabel="Email address"
                            />
                        </View>

                        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                        <ActionButton
                            label="SEND CODE"
                            isLoading={activeAction === 'send'}
                            disabled={isLoading || isTransitioning}
                            onPress={handleSendCode}
                            style={styles.sendCodeButton}
                        />
                    </>
                );
            case 2:
                return (
                    <>
                        <Text style={styles.title}>check your email</Text>
                        <Text style={styles.description}>
                            We have just sent a code to the email{'\n'}{email.trim()}
                        </Text>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Enter Code</Text>
                            <TextInput
                                style={styles.singleInput}
                                value={code}
                                onChangeText={text => {
                                    setCode(text);
                                    setErrorMessage('');
                                }}
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                editable={!isLoading}
                                accessibilityLabel="Enter code"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleResendCode}
                            disabled={resendSeconds > 0 || isLoading || isTransitioning}
                            activeOpacity={0.7}
                            style={styles.resendButton}
                            accessibilityRole="button"
                        >
                            {activeAction === 'resend'
                                ? <ActivityIndicator color="#171717" size="small" />
                                : (
                                    <Text style={styles.resendText}>
                                        {resendSeconds > 0 ? `Resend in ${resendSeconds}` : 'Resend code'}
                                    </Text>
                                )}
                        </TouchableOpacity>

                        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                        <ActionButton
                            label="VERIFY CODE"
                            isLoading={activeAction === 'verify'}
                            disabled={isLoading || isTransitioning}
                            onPress={handleVerifyCode}
                            style={styles.verifyButton}
                        />
                    </>
                );
            case 3:
                return (
                    <>
                        <Text style={styles.title}>Enter New Password</Text>

                        <View style={styles.passwordFields}>
                            {renderPasswordField(
                                'Password',
                                password,
                                showPassword,
                                setPassword,
                                () => setShowPassword(value => !value),
                            )}
                            {renderPasswordField(
                                'Confirm Password',
                                confirmPassword,
                                showConfirmPassword,
                                setConfirmPassword,
                                () => setShowConfirmPassword(value => !value),
                            )}
                        </View>

                        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                        <ActionButton
                            label="RESET"
                            isLoading={activeAction === 'reset'}
                            disabled={isLoading || isTransitioning}
                            onPress={handleResetPassword}
                            style={styles.resetPasswordButton}
                        />
                    </>
                );
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                            disabled={isLoading || isTransitioning}
                            accessibilityRole="button"
                            accessibilityLabel={step === 1 ? 'Back to login' : 'Previous step'}
                        >
                            <ArrowLeft size={20} color="#202938" strokeWidth={2.2} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Forgot password</Text>
                    </View>

                    <Animated.View
                        style={[
                            styles.stepContent,
                            { transform: [{ translateX: contentTranslation }] },
                        ]}
                    >
                        {renderStepContent()}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

interface ActionButtonProps {
    label: string;
    isLoading: boolean;
    disabled: boolean;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
}

const ActionButton: React.FC<ActionButtonProps> = ({
    label,
    isLoading,
    disabled,
    onPress,
    style,
}) => (
    <TouchableOpacity
        style={[styles.actionButton, style, disabled && styles.actionButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
    >
        {isLoading
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={styles.actionButtonText}>{label}</Text>}
    </TouchableOpacity>
);

export default ForgotPassword;

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
        paddingTop: 26,
        paddingBottom: 24,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 26,
    },
    backButton: {
        alignItems: 'center',
        backgroundColor: '#EEF1F4',
        borderRadius: 22,
        height: 44,
        justifyContent: 'center',
        width: 44,
    },
    headerTitle: {
        color: '#353946',
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        marginLeft: 10,
    },
    stepContent: {
        flex: 1,
    },
    title: {
        color: '#111111',
        fontFamily: 'Poppins-Medium',
        fontSize: 23,
        lineHeight: 33,
    },
    description: {
        color: '#363845',
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        lineHeight: 24,
        marginTop: 23,
    },
    firstStepField: {
        marginTop: 34,
    },
    fieldContainer: {
        marginTop: 34,
    },
    label: {
        color: '#171717',
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 5,
    },
    singleInput: {
        backgroundColor: '#EAEAEA',
        borderColor: '#DCDCDC',
        borderRadius: 8,
        borderWidth: 1,
        color: '#222222',
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        height: 52,
        paddingHorizontal: 15,
        paddingVertical: 0,
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
    input: {
        color: '#222222',
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        paddingVertical: 0,
    },
    passwordFields: {
        marginTop: 29,
    },
    actionButton: {
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: '#3B1D0B',
        borderRadius: 12,
        height: 53,
        justifyContent: 'center',
        width: '88%',
    },
    sendCodeButton: {
        marginTop: 40,
    },
    verifyButton: {
        marginTop: 36,
    },
    resetPasswordButton: {
        marginTop: 40,
    },
    actionButtonDisabled: {
        opacity: 0.65,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
    },
    resendButton: {
        alignSelf: 'center',
        justifyContent: 'center',
        marginTop: 32,
        minHeight: 28,
        paddingHorizontal: 10,
    },
    resendText: {
        color: '#171717',
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
    },
    errorText: {
        color: '#D92D20',
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
    },
});
