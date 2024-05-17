import { APIGatewayEventRequestContextV2, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { AuthorizationCode } from "simple-oauth2";
import { getConfig } from "./lib/config";

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: APIGatewayEventRequestContextV2
): Promise<APIGatewayProxyResultV2> => {
  console.log(event);
  try {
    const { Host } = event.headers;
    if (!event.queryStringParameters) throw new Error(`Missing QueryParameters`);

    const { code } = event.queryStringParameters;

    const provider = "github"; // TODO: support gitlab

    if (!code) throw new Error(`Missing code ${code}`);

    const config = await getConfig(provider);

    const client = new AuthorizationCode(config);
    const redirect_uri = `https://${Host}/prod/callback?provider=${provider}`;
    const tokenParams = { code, redirect_uri };
    console.log(tokenParams);

    const accessToken = await client.getToken(tokenParams);
    const token = accessToken.token["access_token"] as string;

    return {
      statusCode: 200,
      body: getScript("success", { token, provider }),
      headers: { "Content-Type": "text/html; charset=utf-8" },
    };
  } catch (e) {
    return {
      statusCode: 200,
      body: getScript("error", e as any),
      headers: { "Content-Type": "text/html; charset=utf-8" },
    };
  }
};

function getScript(mess: string, content: { token: string; provider: string }) {
  return `<html><body><script>
  (function() {
    function receiveMessage(e) {
      console.log("receiveMessage %o", e)
      window.opener.postMessage(
        'authorization:github:${mess}:${JSON.stringify(content)}',
        e.origin
      )
      window.removeEventListener("message",receiveMessage,false);
    }
    window.addEventListener("message", receiveMessage, false)
    console.log("Sending message: %o", "github")
    window.opener.postMessage("authorizing:github", "*")
    })()
  </script></body></html>`;
}