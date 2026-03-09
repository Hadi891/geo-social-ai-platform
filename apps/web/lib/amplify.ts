import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "eu-north-1_2dYWQqgpa",
      userPoolClientId: "1p46tmkc8nh74cknfpugikv9bd",
      loginWith: {
        email: true,
      },
    },
  },
});

export default Amplify;