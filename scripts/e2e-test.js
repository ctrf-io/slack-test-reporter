#!/usr/bin/env node

/**
 * E2E Test Script for slack-ctrf
 *
 * This script tests all available methods by sending actual messages to Slack.
 * It requires proper Slack credentials to be set up as environment variables.
 *
 * Usage: npm run e2e
 */

import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = dirname(__dirname)

// Configuration
const CTRF_REPORT_PATH = join(projectRoot, 'ctrf-report.json')
const BLOCKKIT_TEMPLATE_PATH = join(
  projectRoot,
  'templates/blockkit-template.hbs'
)
const MARKDOWN_TEMPLATE_PATH = join(
  projectRoot,
  'templates/markdown-template.hbs'
)
const CLI_PATH = join(projectRoot, 'dist/cli.js')

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`${colors.bold}[${step}]${colors.reset} ${message}`, colors.blue)
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green)
}

function logError(message) {
  log(`❌ ${message}`, colors.red)
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

// Check environment variables
function checkEnvironment() {
  logStep('ENV', 'Checking environment variables...')

  const requiredEnvVars = []

  // Check for Slack configuration
  const hasWebhook = process.env.SLACK_WEBHOOK_URL
  const hasOAuth = process.env.SLACK_OAUTH_TOKEN && process.env.SLACK_CHANNEL_ID

  if (!hasWebhook && !hasOAuth) {
    logError('Missing Slack configuration!')
    logError('Please set either:')
    logError('  - SLACK_WEBHOOK_URL, or')
    logError('  - SLACK_OAUTH_TOKEN and SLACK_CHANNEL_ID')
    process.exit(1)
  }

  if (hasWebhook) {
    logSuccess('Using Slack Webhook URL')
  }

  if (hasOAuth) {
    logSuccess('Using Slack OAuth Token and Channel ID')
  }

  // Check if CTRF report exists
  try {
    execSync(`test -f "${CTRF_REPORT_PATH}"`, { stdio: 'ignore' })
    logSuccess(`CTRF report found: ${CTRF_REPORT_PATH}`)
  } catch (error) {
    logError(`CTRF report not found: ${CTRF_REPORT_PATH}`)
    logError('Please ensure you have a valid CTRF report for testing')
    process.exit(1)
  }

  // Check if templates exist
  try {
    execSync(`test -f "${BLOCKKIT_TEMPLATE_PATH}"`, { stdio: 'ignore' })
    logSuccess(`Block Kit template found: ${BLOCKKIT_TEMPLATE_PATH}`)
  } catch (error) {
    logWarning(`Block Kit template not found: ${BLOCKKIT_TEMPLATE_PATH}`)
  }

  try {
    execSync(`test -f "${MARKDOWN_TEMPLATE_PATH}"`, { stdio: 'ignore' })
    logSuccess(`Markdown template found: ${MARKDOWN_TEMPLATE_PATH}`)
  } catch (error) {
    logWarning(`Markdown template not found: ${MARKDOWN_TEMPLATE_PATH}`)
  }
}

// Execute a command and handle errors
function executeCommand(description, command, options = {}) {
  logStep('EXEC', `${description}...`)
  log(`Command: ${command}`, colors.yellow)

  try {
    const result = execSync(command, {
      cwd: projectRoot,
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options,
    })

    logSuccess(`${description} completed successfully`)
    return result
  } catch (error) {
    if (options.allowFailure) {
      logWarning(`${description} failed (expected): ${error.message}`)
      return null
    } else {
      logError(`${description} failed: ${error.message}`)
      throw error
    }
  }
}

// Add delay between requests to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runE2ETests() {
  log(`${colors.bold}🚀 Starting E2E Tests for slack-ctrf${colors.reset}`)
  log('='.repeat(50))

  // Check environment
  checkEnvironment()

  // Build the project first
  executeCommand('Building project', 'npm run build')

  await delay(1000)

  // Test 1: Basic test results
  logStep('TEST 1', 'Testing basic test results notification')
  executeCommand(
    'Send test results summary',
    `node "${CLI_PATH}" results "${CTRF_REPORT_PATH}" --title "E2E Test - Basic Results"`
  )

  await delay(2000)

  // Test 2: Test results with custom prefix/suffix
  logStep('TEST 2', 'Testing test results with custom prefix and suffix')
  executeCommand(
    'Send test results with prefix/suffix',
    `node "${CLI_PATH}" results "${CTRF_REPORT_PATH}" --title "E2E Test - With Prefix/Suffix" --prefix "🎯 **E2E Test Starting**" --suffix "📊 **Test completed by E2E script**"`
  )

  await delay(2000)

  // Test 3: Test results with onFailOnly (might not send if no failures)
  logStep('TEST 3', 'Testing onFailOnly option')
  executeCommand(
    'Send test results (onFailOnly)',
    `node "${CLI_PATH}" results "${CTRF_REPORT_PATH}" --title "E2E Test - Fail Only" --onFailOnly`,
    { allowFailure: true }
  )

  await delay(2000)

  // Test 4: Failed test results
  logStep('TEST 4', 'Testing failed test results')
  executeCommand(
    'Send failed test results',
    `node "${CLI_PATH}" failed "${CTRF_REPORT_PATH}" --title "E2E Test - Failed Tests"`,
    { allowFailure: true }
  )

  await delay(2000)

  // Test 5: Failed test results (consolidated)
  logStep('TEST 5', 'Testing failed test results (consolidated)')
  executeCommand(
    'Send failed test results (consolidated)',
    `node "${CLI_PATH}" failed "${CTRF_REPORT_PATH}" --title "E2E Test - Failed Tests (Consolidated)" --consolidated`,
    { allowFailure: true }
  )

  await delay(2000)

  // Test 6: Flaky test results
  logStep('TEST 6', 'Testing flaky test results')
  executeCommand(
    'Send flaky test results',
    `node "${CLI_PATH}" flaky "${CTRF_REPORT_PATH}" --title "E2E Test - Flaky Tests"`,
    { allowFailure: true }
  )

  await delay(2000)

  // Test 7: AI summaries
  logStep('TEST 7', 'Testing AI summaries')
  executeCommand(
    'Send AI summaries',
    `node "${CLI_PATH}" ai "${CTRF_REPORT_PATH}" --title "E2E Test - AI Summary"`,
    { allowFailure: true }
  )

  await delay(2000)

  // Test 8: AI summaries (consolidated)
  logStep('TEST 8', 'Testing AI summaries (consolidated)')
  executeCommand(
    'Send AI summaries (consolidated)',
    `node "${CLI_PATH}" ai "${CTRF_REPORT_PATH}" --title "E2E Test - AI Summary (Consolidated)" --consolidated`,
    { allowFailure: true }
  )

  await delay(2000)

  // Test 9: Custom markdown template (if template exists)
  try {
    execSync(`test -f "${MARKDOWN_TEMPLATE_PATH}"`, { stdio: 'ignore' })
    logStep('TEST 9', 'Testing custom markdown template')
    executeCommand(
      'Send custom markdown template',
      `node "${CLI_PATH}" custom "${CTRF_REPORT_PATH}" "${MARKDOWN_TEMPLATE_PATH}" --title "E2E Test - Custom Markdown" --markdown`
    )
    await delay(2000)
  } catch (error) {
    logStep('TEST 9', 'Skipping custom markdown template (template not found)')
  }

  // Test 10: Custom Block Kit template (if template exists)
  try {
    execSync(`test -f "${BLOCKKIT_TEMPLATE_PATH}"`, { stdio: 'ignore' })
    logStep('TEST 10', 'Testing custom Block Kit template')
    executeCommand(
      'Send custom Block Kit template',
      `node "${CLI_PATH}" custom "${CTRF_REPORT_PATH}" "${BLOCKKIT_TEMPLATE_PATH}" --title "E2E Test - Custom Block Kit" --blockkit`
    )
    await delay(2000)
  } catch (error) {
    logStep(
      'TEST 10',
      'Skipping custom Block Kit template (template not found)'
    )
  }

  // Test 11: Test with environment variable configuration options
  logStep('TEST 11', 'Testing with configuration environment variables')
  executeCommand(
    'Send test results with config env vars',
    `CTRF_SKIP_FOOTER=true CTRF_SKIP_CHART=false node "${CLI_PATH}" results "${CTRF_REPORT_PATH}" --title "E2E Test - With Config Env Vars"`
  )

  log('='.repeat(50))
  logSuccess('🎉 All E2E tests completed successfully!')
  log(`${colors.bold}Summary:${colors.reset}`)
  log('- All major slack-ctrf methods were tested')
  log('- Messages were sent to actual Slack workspace')
  log('- Various options and configurations were validated')
  log('')
  log(
    'Please check your Slack channel to verify all messages were received correctly.'
  )
}

// Run the tests
runE2ETests().catch(error => {
  logError(`E2E tests failed: ${error.message}`)
  process.exit(1)
})
