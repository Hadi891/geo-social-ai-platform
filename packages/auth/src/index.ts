export type SignUpInput = {
  email: string;
  password: string;
};

export type ConfirmSignUpInput = {
  email: string;
  code: string;
};

export type SignInInput = {
  email: string;
  password: string;
};