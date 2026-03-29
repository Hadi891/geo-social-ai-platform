import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: 'eu-north-1_2dYWQqgpa',
  ClientId: '1p46tmkc8nh74cknfpugikv9bd',
});

/** Register a new user. Cognito will send a verification email. */
export function cognitoSignUp(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const attrs = [new CognitoUserAttribute({ Name: 'email', Value: email })];
    userPool.signUp(email, password, attrs, [], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Confirm registration using the code sent to the user's email. */
export function cognitoConfirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Sign in and return the raw JWT id token. */
export function cognitoSignIn(email: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session.getIdToken().getJwtToken()),
      onFailure: reject,
      newPasswordRequired: () => reject(new Error('New password required')),
    });
  });
}

/** Resend the confirmation code to the user's email. */
export function cognitoResendCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.resendConfirmationCode((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Sign out the current user and clear the local session. */
export function cognitoSignOut(): void {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}

/** Get the JWT id token for the currently signed-in user. */
export function cognitoGetToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) return reject(new Error('No user is signed in'));
    user.getSession(
      (
        err: Error | null,
        session: { isValid(): boolean; getIdToken(): { getJwtToken(): string } } | null,
      ) => {
        if (err || !session) return reject(err ?? new Error('Failed to retrieve session'));
        if (!session.isValid()) return reject(new Error('Session expired — please sign in again'));
        resolve(session.getIdToken().getJwtToken());
      },
    );
  });
}
