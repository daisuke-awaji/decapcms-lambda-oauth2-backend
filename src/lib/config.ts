export type Provider = "github" | "gitlab";
export const providers: Provider[] = ["github", "gitlab"];
import AWS from 'aws-sdk';

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME as string;

const decrypt = async (key: string) => {
  const kms = new AWS.KMS();
  try {
    const req = {
      CiphertextBlob: Buffer.from(key, 'base64'),
      EncryptionContext: { LambdaFunctionName: functionName },
    };
    const data = await kms.decrypt(req).promise();
    const decryptedValue = data.Plaintext?.toString('ascii');
    return decryptedValue;
  } catch (err) {
    throw err;
  }
};

const getConfig = async (provider: Provider): Promise<{ client: { id: string; secret: string }; auth: { tokenHost: string; tokenPath: string; authorizePath: string } }> => {
  if (!providers.includes(provider)) {
    throw new Error(`Unsupported provider ${provider}`);
  }

  const clientConfig = {
    id: getClientId(provider),
    secret: await getClientSecret(provider),
  };

  const authConfig = {
    tokenHost: provider === "github" ? "https://github.com" : "https://gitlab.com",
    tokenPath: provider === "github" ? "/login/oauth/access_token" : "/oauth/token",
    authorizePath: provider === "github" ? "/login/oauth/authorize" : "/oauth/authorize",
  };

  return { client: clientConfig, auth: authConfig };
};

const getClientId = (provider: Provider): string => {
  return process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`] as string;
};

const getClientSecret = async (provider: Provider): Promise<string> => {
  const encryptedSecret = process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_SECRET`] as string;
  return await decrypt(encryptedSecret);
};

export { getConfig };