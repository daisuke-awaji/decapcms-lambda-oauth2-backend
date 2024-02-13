import { APIGatewayEventRequestContextV2, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

import { AuthorizationCode } from "simple-oauth2";
import { randomBytes } from "crypto";
import { config } from "./lib/config";
import { scopes } from "./lib/scopes";

export const randomString = () => randomBytes(32).toString("hex");

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: APIGatewayEventRequestContextV2
): Promise<APIGatewayProxyResultV2> => {
  const { Host } = event.headers;

  const provider = "github"; // TODO: support gitlab
  const client = new AuthorizationCode(config(provider));

  const state = randomString();
  const authorizationUri = client.authorizeURL({
    redirect_uri: `https://${Host}/prod/callback?provider=${provider}`,
    scope: scopes[provider],
    state,
  });

  return {
    statusCode: 302,
    headers: {
      Location: authorizationUri,
    },
  };
};
