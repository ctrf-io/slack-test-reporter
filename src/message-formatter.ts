import { CtrfReport } from '../types/ctrf';

export const formatResultsMessage = (ctrf: CtrfReport): object => {
    const { summary, environment } = ctrf.results;
    const passedTests = summary.passed;
    const failedTests = summary.failed;
    const skippedTests = summary.skipped;
    const pendingTests = summary.pending;
    const otherTests = summary.other;
  
    let title = "CTRF Test Results - No build details provided";
    let missingEnvProperties: string[] = [];
  
    if (environment) {
      const { buildName, buildNumber, buildUrl } = environment;
  
      if (buildName && buildNumber) {
        title = `CTRF Test Results - ${buildName} ${buildNumber}`;
      } else if (buildName || buildNumber) {
        title = `Test Results - ${buildName || ''} ${buildNumber || ''}`;
      }
  
      if (!buildName) {
        missingEnvProperties.push('buildName');
      }
  
      if (!buildNumber) {
        missingEnvProperties.push('buildNumber');
      }
  
      if (!buildUrl) {
        missingEnvProperties.push('buildUrl');
      }
    } else {
      missingEnvProperties = ['buildName', 'buildNumber', 'buildUrl'];
    }
  
    const color = failedTests > 0 ? '#FF0000' : '#36a64f'; 
    const resultText = failedTests > 0
      ? `*:x: ${failedTests} failed tests*`
      : `*:white_check_mark: Passed*`;
  
    const blocks: any[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title,
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `:white_check_mark: ${passedTests} | :x: ${failedTests} | :fast_forward: ${skippedTests} | :hourglass_flowing_sand: ${pendingTests} | :question: ${otherTests}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: resultText
        }
      }
    ];
  
    if (environment?.buildUrl) {
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Build",
              emoji: true
            },
            url: environment.buildUrl
          }
        ]
      });
    }
  
    if (missingEnvProperties.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:warning: The following environment properties are missing from the CTRF report: ${missingEnvProperties.join(', ')}. Add these environment details to your report for a better experience.`
        }
      });
    }
  
    // Add link to plugin documentation or repository
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "<https://github.com/ctrf-io/slack-ctrf|a CTRF plugin>"
        }
      ]
    });
  
    return {
      attachments: [
        {
          color: color,
          blocks: blocks
        }
      ]
    };
  };


export const formatFailedTestsMessage = (ctrf: CtrfReport): string => {
    const failedTests = ctrf.results.tests.filter(test => test.status === 'failed');
    if (failedTests.length === 0) return 'No failed tests.';

    const message = failedTests.map(test => `Test: ${test.name}\nMessage: ${test.message}\n`).join('\n');
    return `Failed Tests:\n${message}`;
};

export const formatFlakyTestsMessage = (ctrf: CtrfReport): string => {
    const flakyTests = ctrf.results.tests.filter(test => test.flaky);
    if (flakyTests.length === 0) return 'No flaky tests.';

    const message = flakyTests.map(test => `Test: ${test.name}\nRetries: ${test.retries}\n`).join('\n');
    return `Flaky Tests:\n${message}`;
};
