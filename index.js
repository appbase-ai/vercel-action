const { stripIndents } = require('common-tags');
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
////

// Vercel
function getVercelBin() {
  const fallback = packageJSON.dependencies.vercel;
  return `vercel@${fallback}`;
}


const vercelScope = core.getInput('scope');


const vercelBin = getVercelBin();

async function setEnv() {
  core.info('set environment for vercel cli');
  if (vercelOrgId) {
    core.info('set env variable : VERCEL_ORG_ID');
    core.exportVariable('VERCEL_ORG_ID', vercel_team_id);
  }
  if (vercelProjectId) {
    core.info('set env variable : VERCEL_PROJECT_ID');
    core.exportVariable('VERCEL_PROJECT_ID', vercel_project_id);
  }
}

async function aliasDomainsToDeployment(deploymentUrl) {
  if (!deploymentUrl) {
    core.error('deployment url is null');
  }

  if (vercel_scope) {
    core.info('using scope');
    args.push('--scope', vercel_scope);
  }
  const promises = aliasDomains.map((domain) =>
    retry(
      () =>
        exec.exec('npx', [vercelBin, ...args, 'alias', deploymentUrl, domain]),
      2,
    ),
  );

  await Promise.all(promises);
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

  await aliasDomainsToDeployment(deploymentUrl);

  run().catch((error) => {
    core.setFailed(error.message);
  });
}
