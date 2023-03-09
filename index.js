const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const { context } = github;
const axios = require('axios');
const ref_token = core.getInput('ref_token', {
  required: true,
});

const ref_sha = core.getInput('ref_sha', {
  required: true,
});

async function getAuthor() {
  const config = {
    method: 'get',
    url: `https://api.github.com/repos/appbase-ai/synapps/commits/${ref_sha}`,
    headers: {
      Authorization: `Bearer ${ref_token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json',
    },
  };

  axios(config).then((resp) => {
    const author = resp.data?.author?.login;
    core.notice("author: ", author);
    return author;
  });
}

const vercel_access_token = core.getInput('vercel_access_token', {
  required: true,
});

const vercel_project_id = core.getInput('vercel_project_id', {
  required: true,
});
const vercel_team_id = core.getInput('vercel_project_id', {
  required: true,
});
const generated_url = core.getInput('github_deployment_generated', {
  required: true,
});

const aliasTemplate = core.getInput('alias_template');
const vercel_scope = core.getInput('scope');

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

async function aliasDomainsToDeployment(deploymentUrl, author) {
  let subdomain;
  let myOutput = '';
  let myError = '';
  const options = {};
  options.listeners = {
    stdout: (data) => {
      // eslint-disable-next-line no-unused-vars
      myOutput += data.toString();
    },
    stderr: (data) => {
      myError += data.toString();
    },
  };

  if (!deploymentUrl) {
    core.error('deployment url is null');
  }
  const args = ['-t', vercel_access_token];
  if (vercel_scope) {
    core.info('using scope');
    args.push('--scope', vercel_scope);
  }

  switch (author) {
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
  core.info(`linking: ${domain} to: ${deploymentUrl}`);
  const response = await exec.exec(
    'npx',
    ['vercel', ...args, 'alias', deploymentUrl, domain],
    options,
  );

  core.info(response);
  core.error(myError);
  core.info(myOutput);
}

async function run() {
  try {
    await setEnv();
    const author = await getAuthor();
    await aliasDomainsToDeployment(generated_url, author);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
