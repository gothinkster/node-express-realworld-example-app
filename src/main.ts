import serverlessExpress from '@codegenie/serverless-express';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManagerClient({});
let serverlessHandler: ReturnType<typeof serverlessExpress> | undefined;

const getHandler = async () => {
  if (serverlessHandler) {
    return serverlessHandler;
  }

  const secretArn = process.env.APP_SECRET_ARN;
  if (!secretArn) {
    throw new Error('APP_SECRET_ARN must be configured for the Lambda runtime.');
  }

  const secretResult = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );
  if (!secretResult.SecretString) {
    throw new Error('The application database secret has no SecretString value.');
  }

  const credentials = JSON.parse(secretResult.SecretString);
  if (
    !credentials.username ||
    !credentials.password ||
    !credentials.host ||
    !credentials.port ||
    !credentials.dbname
  ) {
    throw new Error('The application database secret is missing required connection fields.');
  }

  const databaseUrl = new URL(
    `postgresql://${encodeURIComponent(credentials.username)}:${encodeURIComponent(credentials.password)}@${credentials.host}:${credentials.port}/${credentials.dbname}`,
  );
  databaseUrl.searchParams.set('sslmode', 'require');
  process.env.DATABASE_URL = databaseUrl.toString();
  process.env.DIRECT_URL = databaseUrl.toString();

  const { default: app } = await import('./app');
  serverlessHandler = serverlessExpress({ app });
  return serverlessHandler;
};

export const handler = async (
  event: Parameters<ReturnType<typeof serverlessExpress>>[0],
  context: Parameters<ReturnType<typeof serverlessExpress>>[1],
) => {
  const invoke = await getHandler();
  return invoke(event, context);
};

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const { default: app } = require('./app');
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.info(`server up on port ${PORT}`);
  });
}
