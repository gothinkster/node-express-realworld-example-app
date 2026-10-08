# ![Node/Express/Prisma Example App](project-logo.png)

[![Build Status](https://travis-ci.org/anishkny/node-express-realworld-example-app.svg?branch=master)](https://travis-ci.org/anishkny/node-express-realworld-example-app)

> ### Example Node (Express + Prisma) codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld-example-apps) API spec.

<a href="https://thinkster.io/tutorials/node-json-api" target="_blank"><img width="454" src="https://raw.githubusercontent.com/gothinkster/realworld/master/media/learn-btn-hr.png" /></a>

## Getting Started

### Prerequisites

Run the following command to install dependencies:

```shell
npm install
```

### Environment variables

This project depends on some environment variables.
If you are running this project locally, create a `.env` file at the root for these variables.
Your host provider should included a feature to set them there directly to avoid exposing them.

Here are the required ones:

```
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
NODE_ENV=production
```

For PostgreSQL, set `DATABASE_URL` to the application connection string and `DIRECT_URL` to the direct connection string used by Prisma migrations. For the AWS RDS deployment in this assignment, both use the private RDS endpoint with `sslmode=require`. Locally, both can use the same connection string. Keep credentials in an ignored `.env` file for local development and AWS Secrets Manager in deployed environments; never commit credentials.

### Private RDS migrations

The RDS database is private and accepts connections only from the application Lambda and the Jenkins host security group over same-region VPC peering. Jenkins runs on the existing EC2 host, avoiding a second always-on build instance. VPC peering has no hourly connection charge; data transfer may be billed. The VPC has a private Secrets Manager interface endpoint for Lambda. Jenkins uses its EC2 instance role to call Secrets Manager through its existing outbound connectivity. The Secrets Manager interface endpoint has an hourly charge and is not covered by the typical RDS free-tier allowance.

Jenkins temporarily reads the RDS-managed master credential to create a restricted `realworld_app` database role. It runs `prisma migrate deploy` as that restricted role and stores the application credential JSON in the dedicated Secrets Manager secret. Terraform grants the configured Jenkins EC2 role access only to the RDS master secret and this application secret. The Lambda role can read only the application secret; it cannot read the RDS master secret. Never print or commit either credential.

To run migrations from Jenkins after VPC peering and its IAM policy are applied, configure these non-secret values from Terraform outputs as pipeline environment variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `RDS_MASTER_SECRET_ARN`, `APP_SECRET_ARN`, and `APP_DB_USERNAME=realworld_app`. Jenkins must check out the backend repository and use the repository's Node/npm toolchain. Then run:

```shell
npm ci
DATABASE_URL='postgresql://placeholder:placeholder@localhost:5432/realworld' \
DIRECT_URL='postgresql://placeholder:placeholder@localhost:5432/realworld' \
  npx prisma generate
node scripts/provision-app-db-user.js
```

The placeholder URLs are used only for Prisma client generation; migrations and database-user provisioning obtain their real credentials from Secrets Manager at runtime. Jenkins must run migrations before publishing a backend release. The private, encrypted, versioned S3 bucket is reserved for deployment artifacts and expires old migration artifacts after 30 days.

## Assignment deployment architecture

The development frontend is published to the `gh-pages` branch of the frontend fork and served over HTTPS by GitHub Pages. AWS denied CloudFront distribution creation pending account verification, and its account-level S3 Block Public Access setting denies public bucket policies, so Terraform keeps the S3 frontend bucket private and does not use it for hosting. API Gateway HTTP API invokes the Express application on Lambda. Lambda runs in private subnets and connects to private, encrypted RDS PostgreSQL. A Secrets Manager interface VPC endpoint lets Lambda fetch the restricted application credential without a NAT gateway. Jenkins runs on an EC2 host and reaches RDS through same-region VPC peering for migrations. The Jenkins deployment credential is a narrowly scoped GitHub token; for production, request AWS account verification and restore private S3 access through CloudFront Origin Access Control.

Terraform provisions the application stack and stores state in the encrypted, versioned S3 state bucket with native S3 lock files. The state-bucket bootstrap is separate from the application stack. Keep Terraform state and plan files out of Git.

## Jenkins CI/CD

Configure a Jenkins Pipeline job to load this repository's `Jenkinsfile`. The existing Jenkins EC2 instance profile provides AWS authentication; do not put long-lived AWS access keys in Jenkins or source control. The job clones the frontend repository and runs:

1. `npm ci`, Prisma client generation, backend production build, and backend tests. The seed-only `@ngneat/falso` package is a development dependency and is excluded from the Lambda runtime package.
2. Frontend dependency install and build, dependency audit reports, and Checkov Terraform scanning when Checkov is installed on the Jenkins agent.
3. Lambda packaging and upload under an immutable commit/build-number S3 key.
4. `prisma migrate deploy` from Jenkins over private VPC peering before application deployment.
5. Terraform plan for API Gateway, Lambda, private S3 buckets, IAM, and CloudWatch, followed by a manual Jenkins approval gate before apply.
6. React production build using the API Gateway URL, authenticated publish to the frontend repository's `gh-pages` branch, and API/frontend smoke checks.

Create a Jenkins `Username with password` credential with ID `frontend-github-pages`; use the GitHub username and a fine-grained personal access token limited to the frontend repository's Contents read/write permission. Enable GitHub Pages for that repository from the `gh-pages` branch root. The pipeline force-updates only this dedicated deployment branch.

The deployed Lambda artifact key records the source Git commit and Jenkins build number. Use Git SemVer tags for release labels; do not deploy a mutable `latest` artifact. Review pipeline scan reports and address or document findings rather than describing an unreviewed audit as clean.

The pipeline stores npm's download cache in `/home/ec2-user/.cache/jenkins/npm` on the `aws-builder` agent, outside the Jenkins workspace. This cache survives `deleteDir()` between builds and is reused by backend, frontend, and Lambda dependency installs. `npm ci` still performs a clean install from each lockfile; only downloaded package data is cached. Monitor agent disk usage and periodically run `sudo -u ec2-user npm cache clean --force` if the cache grows too large.

## Monitoring and security

CloudWatch retains Lambda and API Gateway logs for seven days, provides Lambda error alarms, and the Terraform stack creates a dashboard for Lambda invocations/errors/throttles/duration, API Gateway request/latency/5xx metrics, and RDS CPU/connections. Grafana can visualize CloudWatch metrics if needed; Prometheus is not used to scrape Lambda.

RDS is encrypted, private, single-AZ for the demo, and only accepts PostgreSQL from the Lambda and Jenkins security groups. Lambda may read only the restricted application secret; Jenkins can read the RDS-managed master secret only to run migrations and provision the app user. Both S3 buckets remain private and block public access. GitHub Pages hosts only public frontend assets; no secrets or private data are deployed there. Dependency audit and Terraform scan outputs are archived by Jenkins. Never commit `.env`, AWS credentials, generated secret values, Terraform state, or plan files.

## Cost and limitations

The API and frontend use managed/serverless hosting, but standard RDS PostgreSQL is provisioned and can incur instance/storage charges while running. Interface VPC endpoints also have hourly charges and are not necessarily covered by Free Tier. CloudWatch logs, Secrets Manager, EC2/Jenkins, GitHub Pages plan limits, S3 artifact storage/requests, and data transfer can incur charges or limits. GitHub Pages supplies HTTPS; AWS CloudFront remains the planned production CDN after account verification. Eligibility depends on account age, region, current AWS terms, and usage. Use AWS Billing/Cost Explorer and a budget alert; stop or remove disposable resources after capturing evidence.

This is a single-region development demonstration: RDS is single-AZ with short backup/log retention, Jenkins is a single EC2 host, and no production high availability or load testing is claimed. A production version should add a reviewed multi-AZ database/backup strategy, approval gates, secret rotation, stronger frontend/API CORS restrictions, separate environments, and tested recovery procedures.

## Challenges encountered

- The starter frontend referenced a stylesheet URL that returned 404. Bootstrap is now installed locally and included in the frontend build; the original external theme is no longer required for the app to render.
- PostgreSQL on Amazon Linux initially used `ident` for local TCP authentication. The local development setup was corrected with a database-specific SCRAM rule; the deployed RDS database uses private security-group access and Secrets Manager credentials instead.
- Auth service tests initially reached a real EC2 database because the Prisma mock loaded after the service. Import order was fixed, and the test suite passed (26 tests passed, one existing test remains marked todo).
- The AWS account allowed zero CodeBuild builds. CodeBuild was removed from the design; Jenkins on the existing EC2 host is used for CI/CD and private RDS migrations over VPC peering.
- AWS required account verification before creating CloudFront and enforced account-level S3 Block Public Access, preventing a public website bucket. GitHub Pages is used for the public static frontend while S3 buckets remain private; CloudFront remains the production target after verification.
- The initial Lambda ZIP exceeded AWS's 250 MiB uncompressed limit. The seed-only faker dependency is excluded from production dependencies, and the pipeline checks the uncompressed artifact size before upload/deployment.
- Terraform bootstrap and application state are kept separate in S3, with versioning and native S3 lock files. The application plan was reviewed before applying the VPC, RDS, endpoints, and Jenkins connectivity.

Screenshots, scan reports, and build logs should be captured from actual successful runs and attached to the submission. Do not represent a planned or unexecuted pipeline as a successful deployment.

### Generate your Prisma client

Run the following command to generate the Prisma Client which will include types based on your database schema:

```shell
npx prisma generate
```

### Apply any SQL migration script

Run the following command to create/update your database based on existing sql migration scripts:

```shell
npx prisma migrate deploy
```

### Run the project

Run the following command to run the project:

```shell
npx nx serve api
```

### Seed the database

The project includes a seed script to populate the database:

```shell
npx prisma db seed
```

## Deploy on a remote server

Run the following command to:
- install dependencies
- apply any new migration sql scripts
- run the server

```shell
npm ci && npx prisma migrate deploy && node dist/api/main.js
```
