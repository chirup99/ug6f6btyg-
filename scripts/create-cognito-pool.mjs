import { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand, CreateUserPoolDomainCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "eu-north-1" });

async function createCognitoPool() {
  try {
    console.log("Creating User Pool...");
    const createPoolResult = await client.send(new CreateUserPoolCommand({
      PoolName: "TradingPlatform-UserPool",
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: true,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: false
        }
      },
      AutoVerifiedAttributes: ["email"],
      UsernameAttributes: ["email"],
      MfaConfiguration: "OFF",
      AccountRecoverySetting: {
        RecoveryMechanisms: [{ Priority: 1, Name: "verified_email" }]
      },
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false
      },
      Schema: [
        { Name: "email", AttributeDataType: "String", Mutable: true, Required: true },
        { Name: "name", AttributeDataType: "String", Mutable: true, Required: false }
      ]
    }));

    const userPoolId = createPoolResult.UserPool.Id;
    console.log("User Pool Created:", userPoolId);

    console.log("Creating App Client...");
    const createClientResult = await client.send(new CreateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientName: "TradingPlatform-WebClient",
      GenerateSecret: false,
      ExplicitAuthFlows: [
        "ALLOW_USER_PASSWORD_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH",
        "ALLOW_USER_SRP_AUTH"
      ],
      SupportedIdentityProviders: ["COGNITO"],
      CallbackURLs: [
        "https://91ba2c3a-68d3-4f1e-a4a1-f685b7b4c03c-00-3ag6v7nizv6rm.pike.replit.dev/landing",
        "https://91ba2c3a-68d3-4f1e-a4a1-f685b7b4c03c-00-3ag6v7nizv6rm.pike.replit.dev/",
        "http://localhost:5000/landing",
        "http://localhost:5000/"
      ],
      LogoutURLs: [
        "https://91ba2c3a-68d3-4f1e-a4a1-f685b7b4c03c-00-3ag6v7nizv6rm.pike.replit.dev/landing",
        "http://localhost:5000/landing"
      ],
      AllowedOAuthFlows: ["code"],
      AllowedOAuthScopes: ["openid", "email", "profile"],
      AllowedOAuthFlowsUserPoolClient: true
    }));

    const clientId = createClientResult.UserPoolClient.ClientId;
    console.log("App Client Created:", clientId);

    const domainPrefix = "tradingplatform-" + Date.now().toString().slice(-6);
    console.log("Creating Domain with prefix:", domainPrefix);
    
    try {
      await client.send(new CreateUserPoolDomainCommand({
        UserPoolId: userPoolId,
        Domain: domainPrefix
      }));
      console.log("Domain Created:", domainPrefix);
    } catch (domainError) {
      console.log("Domain creation note:", domainError.message);
    }

    const domain = `${domainPrefix}.auth.eu-north-1.amazoncognito.com`;

    console.log("\n=== COGNITO CONFIGURATION ===");
    console.log("VITE_COGNITO_USER_POOL_ID=" + userPoolId);
    console.log("VITE_COGNITO_APP_CLIENT_ID=" + clientId);
    console.log("VITE_COGNITO_DOMAIN=" + domain);
    console.log("AWS_COGNITO_USER_POOL_ID=" + userPoolId);
    console.log("AWS_COGNITO_APP_CLIENT_ID=" + clientId);

    return { userPoolId, clientId, domain };
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

createCognitoPool();
