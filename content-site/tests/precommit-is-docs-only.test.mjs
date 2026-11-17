import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDocsOnlyFile,
  isDocsOnlyFileList,
  shouldSkipTestSuite,
} from '../scripts/precommit-is-docs-only.mjs';

test('docs/ paths and any .md file are docs-only; other paths are not', () => {
  assert.equal(isDocsOnlyFile('docs/guide.md'), true);
  assert.equal(isDocsOnlyFile('docs/README'), true);
  assert.equal(isDocsOnlyFile('README.md'), true);
  assert.equal(isDocsOnlyFile('content-site/src/pages/index.astro'), false);
  assert.equal(isDocsOnlyFile('content-site/src/content/blog/post.md'), true);
  assert.equal(isDocsOnlyFile('docs.md.bak'), false);
});

test('a file list is docs-only only when it is non-empty and every path qualifies', () => {
  assert.equal(isDocsOnlyFileList([]), false);
  assert.equal(isDocsOnlyFileList(['docs/a.md']), true);
  assert.equal(isDocsOnlyFileList(['README.md', 'docs/guide.txt']), true);
  assert.equal(isDocsOnlyFileList(['docs/a.md', 'content-site/src/pages/index.astro']), false);
});

test('staged docs-only input skips the suite; mixed or empty input does not', () => {
  assert.equal(shouldSkipTestSuite('docs/guide.md\nREADME.md\n'), true);
  assert.equal(shouldSkipTestSuite('content-site/src/content/blog/post.md\n'), true);
  assert.equal(shouldSkipTestSuite('README.md\ncontent-site/package.json\n'), false);
  assert.equal(shouldSkipTestSuite(''), false);
  assert.equal(shouldSkipTestSuite('\n'), false);
});
