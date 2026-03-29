import React, { createContext, useContext, useState } from 'react';
import { cognitoSignUp, cognitoConfirmSignUp, cognitoSignIn, cognitoGetToken, cognitoResendCode } from '../lib/cognito';

export type SignupFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: string;
  interests: string[];
  lookingFor: string;
  description: string;
};

type AuthContextType = {
  /** Signup form data accumulated across steps 2-4. */
  signupData: Partial<SignupFormData>;
  /** Merge a partial update into the signup form data. */
  updateSignupData: (patch: Partial<SignupFormData>) => void;
  /** Register a new Cognito user. Triggers email verification. */
  doSignUp: (email: string, password: string) => Promise<void>;
  /** Submit the email verification code. */
  doConfirmSignUp: (email: string, code: string) => Promise<void>;
  /** Authenticate with Cognito. Returns the JWT id token. */
  doSignIn: (email: string, password: string) => Promise<string>;
  /** Resend the email verification code. */
  doResendCode: (email: string) => Promise<void>;
  /** Return the JWT id token for the current session. */
  getToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [signupData, setSignupData] = useState<Partial<SignupFormData>>({});

  const updateSignupData = (patch: Partial<SignupFormData>) => {
    setSignupData((prev) => ({ ...prev, ...patch }));
  };

  return (
    <AuthContext.Provider
      value={{
        signupData,
        updateSignupData,
        doSignUp: cognitoSignUp,
        doConfirmSignUp: cognitoConfirmSignUp,
        doSignIn: cognitoSignIn,
        doResendCode: cognitoResendCode,
        getToken: cognitoGetToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
