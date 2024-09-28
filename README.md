# DecapCMS Lambda Oauth2 Backend

DecapCMS is an open source project that you can use without using Netlify. In order to do so, you need a way to authenticate; one of the ways to do this is using GitHub oAuth. If you're going to do that though, you need a server-side component acting as the oAuth client, allowing your admin users to connect to GitHub's servers to authenticate.

This application "DecapCMS Lambda Oauth2 Backend" acts as a lightweight OAuth Provider wrapper that works on AWS Lambda and Amazon API Gateway instead of the Netlify Auth API.

# Feature

- [x] GitHub OAuth Provider
- [] GitLab OAuth Provider

# Deploy

## 1. OAuth Provider setup

You need to create an API application and make note of the Client ID and a Client Secret so that you can use them in your configuration.

1. In GitHub, go to your account Settings and select Developer Settings, then OAuth Apps or use [this shortcut](https://github.com/settings/developers).

2. Select Register a new application.

3. For the Authorization callback URL, enter https://xxxx.execute-api.ap-northeast-1.amazonaws.com/prod/callback. \*Set this value again after you deploy API Gateway.

## 2. Deploy API Gateway and AWS Lambda

To save GitHub's OAuth Client ID and Secret in Lambda's environment variables, save the values in Parameter Store in advance.

```bash
$ aws ssm put-parameter \
    --type 'String' \
    --name '/CDK/DecapCMSOAuthBackend/OAUTH_GITHUB_CLIENT_ID' \
    --value 'df2655731exxxxxxxx'

$ aws ssm put-parameter \
    --type 'String' \
    --name '/CDK/DecapCMSOAuthBackend/OAUTH_GITHUB_CLIENT_SECRET' \
    --value '26badbd6ecxxxxxxxxxxxxxxxxxxxxxx'
```

then

```
$ cdk deploy
```

Make a note of the API Gateway endpoint that is output to the console. Set this endpoint in the Authorization callback URL on the [GitHub Developer Settings page](https://github.com/settings/developers).

## 3. CMS Config

You also need to add `base_url` to the backend section of your DecapCMS's config file. `base_url` is the live URL of this repo with no trailing slashes.

```yaml
backend:
  name: github
  repo: user/repo # Path to your GitHub repository
  branch: main
  base_url: https://xxxx.execute-api.ap-northeast-1.amazonaws.com # your apigateway endpoint
  auth_endpoint: /prod/auth
```
