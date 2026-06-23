#!/usr/bin/env node
/**
 * generate-tcr.mjs
 *
 * Reads Vitest JSON reporter output for server and client workspaces and
 * produces a Test Completion Report (TCR) at test-completion-report.md.
 *
 * Expected input files (written by vitest --reporter=json):
 *   server/test-results.json
 *   client/test-results.json
 *
 * Usage:
 *   node scripts/generate-tcr.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const SERVER_RESULTS = join(ROOT, 'server', 'test-results.json');
const CLIENT_RESULTS = join(ROOT, 'client', 'test-results.json');
const OUTPUT = join(ROOT, 'test-completion-report.md');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadResults(filePath, workspace) {
  if (!existsSync(filePath)) {
    return {
      workspace,
      error: `Result file not found: ${filePath}. Tests may not have been run.`,
      suites: [],
      summary: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
    };
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    return {
      workspace,
      error: `Could not parse ${filePath}: ${e.message}`,
      suites: [],
      summary: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
    };
  }

  // Vitest JSON shape:
  // { testResults: [ { testFilePath, status, assertionResults: [ { fullName, status, failureMessages, duration } ] } ] }
  const suites = (raw.testResults || []).map((file) => {
    const relativePath = file.testFilePath
      ? file.testFilePath.replace(/\\/g, '/').split(`/${workspace}/`).pop()
      : '(unknown file)';

    const tests = (file.assertionResults || []).map((t) => ({
      name: t.fullName || t.title || '(unnamed)',
      status: t.status, // 'passed' | 'failed' | 'pending' | 'todo'
      duration: t.duration ?? null,
      failureMessages: t.failureMessages || [],
    }));

    return {
      file: `${workspace}/${relativePath}`,
      fileStatus: file.status, // 'passed' | 'failed'
      tests,
    };
  });

  const allTests = suites.flatMap((s) => s.tests);
  const summary = {
    total: allTests.length,
    passed: allTests.filter((t) => t.status === 'passed').length,
    failed: allTests.filter((t) => t.status === 'failed').length,
    skipped: allTests.filter((t) => t.status === 'pending' || t.status === 'todo').length,
    duration: raw.startTime && raw.endTime
      ? ((raw.endTime - raw.startTime) / 1000).toFixed(2)
      : (raw.testResults || []).reduce((acc, f) => acc + (f.endTime - f.startTime || 0), 0) / 1000,
  };

  return { workspace, suites, summary, error: null };
}

function statusIcon(status) {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'pending':
    case 'todo': return '⏭️';
    default: return '❓';
  }
}

function formatDuration(ms) {
  if (ms == null) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function truncate(str, max = 300) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ---------------------------------------------------------------------------
// Report builder
// ---------------------------------------------------------------------------

function buildReport(serverData, clientData) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const allWorkspaces = [serverData, clientData];

  const grandTotal = allWorkspaces.reduce((a, w) => a + w.summary.total, 0);
  const grandPassed = allWorkspaces.reduce((a, w) => a + w.summary.passed, 0);
  const grandFailed = allWorkspaces.reduce((a, w) => a + w.summary.failed, 0);
  const grandSkipped = allWorkspaces.reduce((a, w) => a + w.summary.skipped, 0);

  const overallStatus = grandFailed > 0 ? '❌ FAILED' : grandTotal === 0 ? '⚠️ NO RESULTS' : '✅ PASSED';

  const lines = [];

  // ---- Header ----
  lines.push(`# Test Completion Report (TCR)`);
  lines.push('');
  lines.push(`**Project:** node-conf-starter-uc1`);
  lines.push(`**Feature:** Payment Dispute Triage`);
  lines.push(`**Report Generated:** ${now}`);
  lines.push(`**Test Framework:** Vitest 1.6.1`);
  lines.push(`**Overall Result:** ${overallStatus}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ---- Executive Summary ----
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|---|---|`);
  lines.push(`| Total Tests | ${grandTotal} |`);
  lines.push(`| ✅ Passed | ${grandPassed} |`);
  lines.push(`| ❌ Failed | ${grandFailed} |`);
  lines.push(`| ⏭️ Skipped / Pending | ${grandSkipped} |`);
  lines.push(`| Pass Rate | ${grandTotal > 0 ? ((grandPassed / grandTotal) * 100).toFixed(1) : 0}% |`);
  lines.push('');

  // ---- Per-workspace summary ----
  lines.push('## Workspace Summary');
  lines.push('');
  lines.push(`| Workspace | Total | ✅ Passed | ❌ Failed | ⏭️ Skipped | Status |`);
  lines.push(`|---|---|---|---|---|---|`);

  for (const w of allWorkspaces) {
    if (w.error) {
      lines.push(`| \`${w.workspace}\` | — | — | — | — | ⚠️ ${w.error} |`);
    } else {
      const ws = w.summary.failed > 0 ? '❌ FAILED' : '✅ PASSED';
      lines.push(`| \`${w.workspace}\` | ${w.summary.total} | ${w.summary.passed} | ${w.summary.failed} | ${w.summary.skipped} | ${ws} |`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // ---- Failed tests (quick scan) ----
  const failedTests = allWorkspaces.flatMap((w) =>
    (w.suites || []).flatMap((s) =>
      s.tests
        .filter((t) => t.status === 'failed')
        .map((t) => ({ workspace: w.workspace, file: s.file, name: t.name, messages: t.failureMessages }))
    )
  );

  if (failedTests.length > 0) {
    lines.push('## ❌ Failed Tests');
    lines.push('');
    for (const ft of failedTests) {
      lines.push(`### ${ft.file} — ${ft.name}`);
      lines.push('');
      lines.push('**Workspace:** `' + ft.workspace + '`');
      lines.push('');
      if (ft.messages.length > 0) {
        lines.push('**Failure reason:**');
        lines.push('');
        lines.push('```');
        for (const msg of ft.messages) {
          lines.push(truncate(msg.trim()));
        }
        lines.push('```');
      } else {
        lines.push('_No failure message captured._');
      }
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  // ---- Full test listing per workspace ----
  for (const w of allWorkspaces) {
    lines.push(`## ${w.workspace === 'server' ? '🖥️ Server' : '🌐 Client'} Tests`);
    lines.push('');

    if (w.error) {
      lines.push(`> ⚠️ **Could not load results:** ${w.error}`);
      lines.push('');
      continue;
    }

    if (w.suites.length === 0) {
      lines.push('> ⚠️ No test suites found in results file.');
      lines.push('');
      continue;
    }

    for (const suite of w.suites) {
      const suiteIcon = suite.fileStatus === 'failed' ? '❌' : '✅';
      lines.push(`### ${suiteIcon} \`${suite.file}\``);
      lines.push('');
      lines.push(`| # | Test Name | Status | Duration | Notes |`);
      lines.push(`|---|---|---|---|---|`);

      suite.tests.forEach((t, i) => {
        const icon = statusIcon(t.status);
        const dur = formatDuration(t.duration);
        let notes = '';
        if (t.status === 'failed' && t.failureMessages.length > 0) {
          notes = truncate(t.failureMessages[0].split('\n')[0], 120);
        } else if (t.status === 'pending' || t.status === 'todo') {
          notes = 'Skipped or not yet implemented';
        }
        // Escape pipe chars in test names
        const safeName = t.name.replace(/\|/g, '\\|');
        const safeNotes = notes.replace(/\|/g, '\\|');
        lines.push(`| ${i + 1} | ${safeName} | ${icon} ${t.status} | ${dur} | ${safeNotes} |`);
      });

      lines.push('');
    }
  }

  // ---- Footer ----
  lines.push('---');
  lines.push('');
  lines.push('_Report auto-generated by `scripts/generate-tcr.mjs` after test run._');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const serverData = loadResults(SERVER_RESULTS, 'server');
const clientData = loadResults(CLIENT_RESULTS, 'client');

const report = buildReport(serverData, clientData);
writeFileSync(OUTPUT, report, 'utf8');

console.log(`TCR written → ${OUTPUT}`);

const failed = serverData.summary.failed + clientData.summary.failed;
process.exit(failed > 0 ? 1 : 0);
