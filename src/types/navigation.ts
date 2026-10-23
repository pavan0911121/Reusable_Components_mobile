export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};


export type StackIdentifiersParamList = {
  Home: undefined;
};

export type RootStackParamList = AuthStackParamList & StackIdentifiersParamList;