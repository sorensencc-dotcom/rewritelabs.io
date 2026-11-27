// Google Apps Script: RewriteLabs Daily Briefing Dispatch
// Reads the latest My Drive/AI/briefing-payload.json via DriveApp and dispatches
// a GitHub repository_dispatch (publish-briefing) event — no Windows Task Scheduler,
// G:\My Drive mount, or GCP Service Account key required.
//
// Setup in Apps Script (https://script.google.com):
//   1. Project Settings > Script Properties: add GH_DISPATCH_TOKEN
//      (fine-grained GitHub PAT scoped to sorensencc-dotcom/rewritelabs.io, Contents: Read and write).
//   2. Triggers > Add Trigger: dispatchBriefing | Time-driven | Day timer | 10am to 11am.

const REPO = 'sorensencc-dotcom/rewritelabs.io';
const FILE_NAME = 'briefing-payload.json';
const FOLDER_NAME = 'AI';

function findLatestPayloadFile_() {
  let latest = null;
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  const sources = [];

  while (folders.hasNext()) {
    sources.push(folders.next().getFilesByName(FILE_NAME));
  }
  if (sources.length === 0) {
    sources.push(DriveApp.getFilesByName(FILE_NAME));
  }

  for (const files of sources) {
    while (files.hasNext()) {
      const f = files.next();
      if (f.isTrashed()) continue;
      if (!latest || f.getLastUpdated() > latest.getLastUpdated()) {
        latest = f;
      }
    }
  }
  return latest;
}

function dispatchBriefing(force) {
  const props = PropertiesService.getScriptProperties();
  const token = (props.getProperty('GH_DISPATCH_TOKEN') || '').trim();
  if (!token) throw new Error('Set GH_DISPATCH_TOKEN in Project Settings > Script Properties.');

  const file = findLatestPayloadFile_();
  if (!file) {
    Logger.log('No ' + FILE_NAME + ' found in Drive.');
    return;
  }

  const raw = file.getBlob().getDataAsString('UTF-8').replace(/^\uFEFF/, '');
  const payload = JSON.parse(raw);
  if (!payload || !payload.date) {
    throw new Error('Payload is missing required "date" field.');
  }

  const lastDate = props.getProperty('LAST_DISPATCHED_DATE');
  if (!force && lastDate === payload.date) {
    Logger.log('Already dispatched briefing for ' + payload.date + '; skipping.');
    return;
  }

  const res = UrlFetchApp.fetch('https://api.github.com/repos/' + REPO + '/dispatches', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    payload: JSON.stringify({
      event_type: 'publish-briefing',
      client_payload: payload,
    }),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  if (code !== 204) {
    throw new Error('GitHub dispatch failed: HTTP ' + code + ' ' + res.getContentText());
  }

  props.setProperty('LAST_DISPATCHED_DATE', payload.date);
  Logger.log('Dispatched publish-briefing for ' + payload.date + ' (' + file.getId() + ').');
}

function forceDispatchBriefing() {
  dispatchBriefing(true);
}
