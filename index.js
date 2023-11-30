require('dotenv').config();
const axios = require('axios');

const organizations = [
  'iotexproject',
  'iotubeproject',
  'machinefi',
  'iopay'
];

// Put the first day of the month here
const startDate = "2023-11-01T00:00:00Z";

// Personal Access Token (Replace with your token)
const PAT = process.env.GITHUB_PAT;
const headers = {
  'Authorization': `token ${PAT}`,
  'User-Agent': 'GitHub-Hero'
};

async function getRepos(org) {
  let repos = [];
  let page = 1;
  while (true) {
    const response = await axios.get(`https://api.github.com/orgs/${org}/repos?page=${page}&per_page=100`, { headers });
    repos = repos.concat(response.data);
    // console.log(repos)
    if (response.data.length < 100) break;
    page++;
  }
  return repos;
}
async function getCommits(org, repo,page) {
  return axios.get(`https://api.github.com/repos/${org}/${repo}/commits?since=${startDate}&page=${page}`, { headers });
}
async function main() {
  const users = {};
  for (const org of organizations) {
    const repos = await getRepos(org);
    for (const repo of repos) {
        let page = 0;
        let commits;
        while ((commits = await getCommits(org, repo.name, page)).data.length > 0)
        {
            for (const commit of commits.data) {
                const date = new Date(commit.commit.committer.date).toDateString();
                const authorLogin = commit.author?.login || 'Unknown';
                if (!users[authorLogin]) users[authorLogin] = {};
                if (!users[authorLogin][date]) users[authorLogin][date] = 0;
                users[authorLogin][date]++;
            }
            page++;
        }
    }
  }
  const sortedUsers = Object.entries(users).map(([login, days]) => ({
    login,
    commitDays: Object.keys(days).length,
    commits: Object.values(days).reduce((acc, val) => acc + val, 0)
  })).sort((a, b) => b.commitDays - a.commitDays);
  for (const user of sortedUsers) {
    console.log(`${user.login} - ${user.commits} commits (${user.commitDays} days${user.commitDays >= 10 ? ', √ full-time' : ''})`);
}
}
main().catch(err => console.error(err));