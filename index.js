const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const exec = require('@actions/exec');
const packageJSON = require('./package.json');
const { context } = github;

const vercel_access_token = core.getInput('vercel_access_token', {
  required: true,
});
const vercel_project_id = core.getInput('vercel_project_id', {
  required: true,
});
const generated_url = core.getInput('github_deployment_generated', {
  required: true,
});
const vercel_team_id = core.getInput('vercel_team_id');
const aliasTemplate = core.getInput('alias_template');
const vercel_scope = core.getInput('scope');

// Vercel
function getVercelBin() {
  const fallback = packageJSON.dependencies.vercel;
  return `vercel@${fallback}`;
}

const vercelScope = core.getInput('scope');

const vercelBin = getVercelBin();

async function setEnv() {
  core.info('set environment for vercel cli');
  if (vercel_team_id) {
    core.info('set env variable : VERCEL_ORG_ID');
    core.exportVariable('VERCEL_ORG_ID', vercel_team_id);
  }
  if (vercel_project_id) {
    core.info('set env variable : VERCEL_PROJECT_ID');
    core.exportVariable('VERCEL_PROJECT_ID', vercel_project_id);
  }
}

function retry(fn, retries) {
  async function attempt(retry) {
    try {
      return await fn();
    } catch (error) {
      if (retry > retries) {
        throw error;
      } else {
        core.info(`retrying: attempt ${retry + 1} / ${retries + 1}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return attempt(retry + 1);
      }
    }
  }
  return attempt(1);
}

async function aliasDomainsToDeployment(deploymentUrl) {
  let subdomain;
  if (!deploymentUrl) {
    core.error('deployment url is null');
  }
  const args = ['-t', vercel_access_token];
  if (vercel_scope) {
    core.info('using scope');
    args.push('--scope', vercel_scope);
  }

  switch (context.actor) {
    case 'maceip':
      subdomain = 'ryan';
      break;
    case 'lincicomb':
      subdomain = 'berk';
      break;
    case 'mmajoris':
      subdomain = 'mike';
      break;
    default:
      subdomain = 'preview';
  }

  let domain = `${subdomain}.${aliasTemplate}`;

  await retry(
    () =>
      exec.exec('npx', [vercelBin, ...args, 'alias', deploymentUrl, domain]),
    2,
  );
}

async function run() {
  core.debug(`action : ${context.action}`);
  core.debug(`ref : ${context.ref}`);
  core.debug(`eventName : ${context.eventName}`);
  core.debug(`actor : ${context.actor}`);
  core.debug(`sha : ${context.sha}`);
  core.debug(`workflow : ${context.workflow}`);
  let { ref } = context;
  let { sha } = context;
  await setEnv();

  await aliasDomainsToDeployment(generated_url);

  run().catch((error) => {
    core.setFailed(error.message);
  });
}
