import { CtrfEnvironment, CtrfReport, CtrfTest } from '../types/ctrf';
import { Options } from '../types/reporter';

export const formatResultsMessage = (ctrf: CtrfReport, options?: Options): object => {
  const { summary, environment } = ctrf.results;
  const passedTests = summary.passed;
  const failedTests = summary.failed;
  const skippedTests = summary.skipped;
  const pendingTests = summary.pending;
  const otherTests = summary.other;
  const totalTests = summary.tests;

  let title = options?.title ? options?.title : "Test Results";
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;

  let missingEnvProperties: string[] = [];

  let buildInfo = "*Build:* No build information provided";
  if (environment) {
    const { buildName, buildNumber, buildUrl } = environment;

    if (buildName && buildNumber) {
      const buildText = buildUrl ? `<${buildUrl}|${buildName} #${buildNumber}>` : `${buildName} #${buildNumber}`;
      buildInfo = `*Build:* ${buildText}`;
    } else if (buildName || buildNumber) {
      buildInfo = `*Build:* ${buildName || ''} ${buildNumber || ''}`;
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
    ? `*Result:* ${failedTests} failed tests`
    : `*Result:* Passed`;

  const durationInSeconds = (summary.stop - summary.start) / 1000;
  const durationText = durationInSeconds < 1
    ? "*Duration:* <1s"
    : `*Duration:* ${new Date(durationInSeconds * 1000).toISOString().substr(11, 8)}`;

  const testSummary = `:test_tube: ${totalTests} | :white_check_mark: ${passedTests} | :x: ${failedTests} | :fast_forward: ${skippedTests} | :hourglass_flowing_sand: ${pendingTests} | :question: ${otherTests}`;

  const blocks: any[] = [];

  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: title,
      emoji: true
    }
  });

  if (prefix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: prefix
      }
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${testSummary}`
    }
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${resultText} | ${durationText}\n${buildInfo}`
    }
  });

  if (suffix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: suffix
      }
    });
  }

  if (missingEnvProperties.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: Missing environment properties: ${missingEnvProperties.join(', ')}. Add these to your CTRF report for a better experience.`
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "<https://github.com/ctrf-io/slack-ctrf|Slack Test Reporter> by <https://ctrf.io|CTRF  :green_heart:>"
      }
    ]
  });

  const notification: string[] = [];
  notification.push(title);

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  const message = failedTests > 0 
    ? `Failed: ${failedTests}`
    : 'Passed';
 
  notification.push(message)

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: color,
        blocks: blocks
      }
    ]
  };
};

export const formatFlakyTestsMessage = (ctrf: CtrfReport, options?: Options): object | null => {
  const { summary, environment, tests } = ctrf.results;
  const flakyTests = tests.filter(test => test.flaky);

  if (flakyTests.length === 0) {
    return null;
  }

  let title = options?.title ? options?.title : "Flaky Tests";
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;
  let missingEnvProperties: string[] = [];

  let buildInfo = "Build: No build information provided";
  if (environment) {
    const { buildName, buildNumber, buildUrl } = environment;

    if (buildName && buildNumber) {
      const buildText = buildUrl ? `<${buildUrl}|${buildName} #${buildNumber}>` : `${buildName} #${buildNumber}`;
      buildInfo = `*Build:* ${buildText}`;
    } else if (buildName || buildNumber) {
      buildInfo = `*Build:* ${buildName || ''} ${buildNumber || ''}`;
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

  const flakyTestsText = flakyTests.map(test => `- ${test.name}`).join('\n');

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: title,
        emoji: true
      }
    }
  ];

  if (prefix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: prefix
      }
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `:fallen_leaf: *Flaky tests detected*\n${buildInfo}`
    }
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Flaky Tests*\n${flakyTestsText}`
    }
  });

  if (suffix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: suffix
      }
    });
  }

  if (missingEnvProperties.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: Missing environment properties: ${missingEnvProperties.join(', ')}. Add these to your CTRF report for a better experience.`
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "<https://github.com/ctrf-io/slack-ctrf|Slack Test Reporter> by <https://ctrf.io|CTRF  :green_heart:>"
      }
    ]
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  notification.push('Flaky tests detected')

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: "#FFA500", // Orange color for flaky tests
        blocks: blocks
      }
    ]
  };
};

export const formatAiTestSummary = (test: CtrfTest, environment: CtrfEnvironment | undefined, options?: Options): object | null => {
  const { name, ai, status } = test

  if (!ai || status === "passed") { return null }

  let title = options?.title ? options?.title : `AI Test summary`;
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;
  let missingEnvProperties: string[] = [];

  let buildInfo = "*Build:* No build information provided";
  if (environment) {
    const { buildName, buildNumber, buildUrl } = environment;

    if (buildName && buildNumber) {
      const buildText = buildUrl ? `<${buildUrl}|${buildName} #${buildNumber}>` : `${buildName} #${buildNumber}`;
      buildInfo = `*Build:* ${buildText}`;
    } else if (buildName || buildNumber) {
      buildInfo = `*Build:* ${buildName || ''} ${buildNumber || ''}`;
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

  const color = '#800080'
  const resultText = `*Status:* Failed`

  const aiSummaryText = `*:sparkles: AI Summary:* ${ai}`;

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: title,
        emoji: true
      }
    },
  ]

  if (prefix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: prefix
      }
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Test Name:* ${name}\n${resultText}`
    }
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${aiSummaryText}`
    }
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${buildInfo}`
    }
  });

  if (suffix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: suffix
      }
    });
  }

  if (missingEnvProperties.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: Missing environment properties: ${missingEnvProperties.join(', ')}. Add these to your test for a better experience.`
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "<https://github.com/ctrf-io/slack-ctrf|Slack Test Reporter> by <https://ctrf.io|CTRF  :green_heart:>"
      }
    ]
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  notification.push(name)

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: color,
        blocks: blocks
      }
    ]
  };
};

export const formatConsolidatedAiTestSummary = (
  tests: CtrfTest[],
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {

  const color = '#800080';
  const MAX_FAILED_TESTS = 20;
  const failedTests = tests.filter(test => test.ai && test.status === "failed");

  if (failedTests.length === 0) {
    return null;
  }

  const title = options?.title ? options.title : `:sparkles: AI Test Reporter`;
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;

  let buildInfo = "*Build:* No build information provided";
  if (environment) {
    const { buildName, buildNumber, buildUrl } = environment;
    if (buildName && buildNumber) {
      const buildText = buildUrl ? `<${buildUrl}|${buildName} #${buildNumber}>` : `${buildName} #${buildNumber}`;
      buildInfo = `*Build:* ${buildText}`;
    }
  }

  let missingEnvProperties: string[] = [];
  if (!environment?.buildName) missingEnvProperties.push('buildName');
  if (!environment?.buildNumber) missingEnvProperties.push('buildNumber');
  if (!environment?.buildUrl) missingEnvProperties.push('buildUrl');

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: title,
        emoji: true
      }
    }
  ];

  if (prefix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: prefix
      }
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: buildInfo
    }
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Total Failed Tests:* ${failedTests.length}`
    }
  });

  blocks.push({
    type: "divider"
  });

  const limitedFailedTests = failedTests.slice(0, MAX_FAILED_TESTS);

  limitedFailedTests.forEach(test => {
    const aiSummary = `${test.ai}`;

    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `:x: ${test.name}`,
        emoji: true
      }
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*:sparkles: AI Summary:* ${aiSummary}`
      }
    });
  });

  if (suffix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: suffix
      }
    });
  }

  if (missingEnvProperties.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: *Missing Environment Properties:* ${missingEnvProperties.join(', ')}. Please add these to your test configuration for a better experience.`
      }
    });
  }

  if (failedTests.length > MAX_FAILED_TESTS) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:information_source: Only the first ${MAX_FAILED_TESTS} failed tests are displayed. ${failedTests.length - MAX_FAILED_TESTS} additional failed tests were not included.`
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "<https://github.com/ctrf-io/slack-ctrf|Slack Test Reporter> by <https://ctrf.io|CTRF  :green_heart:>"
      }
    ]
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: color,
        blocks: blocks
      }
    ]
  };
};

export const formatConsolidatedFailedTestSummary = (
  tests: CtrfTest[],
  environment: CtrfEnvironment | undefined,
  options?: Options
): object | null => {

  const color = '#FF0000';
  const MAX_FAILED_TESTS = 20;
  const charLimit = 2950;
  const trimmedNotice = "\n:warning: Message trimmed as too long for Slack";
  const failedTests = tests.filter(test => test.status === "failed");
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;

  if (failedTests.length === 0) {
    return null;
  }

  const title = options?.title ? options.title : `:x: Failed Test Report`;

  let buildInfo = "*Build:* No build information provided";
  if (environment) {
    const { buildName, buildNumber, buildUrl } = environment;
    if (buildName && buildNumber) {
      const buildText = buildUrl ? `<${buildUrl}|${buildName} #${buildNumber}>` : `${buildName} #${buildNumber}`;
      buildInfo = `*Build:* ${buildText}`;
    }
  }

  let missingEnvProperties: string[] = [];
  if (!environment?.buildName) missingEnvProperties.push('buildName');
  if (!environment?.buildNumber) missingEnvProperties.push('buildNumber');
  if (!environment?.buildUrl) missingEnvProperties.push('buildUrl');

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: title,
        emoji: true
      }
    }
  ]

  blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: buildInfo
      }
    })

    if (prefix) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: prefix
        }
      });
    }

    blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Total Failed Tests:* ${failedTests.length}`
      }
    })

    blocks.push(
    {
      type: "divider"
    })

  const limitedFailedTests = failedTests.slice(0, MAX_FAILED_TESTS);

  limitedFailedTests.forEach(test => {
    const failSummary = test.message && test.message.length > charLimit
      ? test.message.substring(0, charLimit - trimmedNotice.length) + trimmedNotice
      : test.message || "No message provided";

    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `:x: ${test.name}`,
        emoji: true
      }
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${failSummary}`
      }
    });
  });

  if (suffix) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: suffix
      }
    });
  }

  if (missingEnvProperties.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: *Missing Environment Properties:* ${missingEnvProperties.join(', ')}. Please add these to your test configuration for a better experience.`
      }
    });
  }

  if (failedTests.length > MAX_FAILED_TESTS) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:information_source: Only the first ${MAX_FAILED_TESTS} failed tests are displayed. ${failedTests.length - MAX_FAILED_TESTS} additional failed tests were not included.`
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "<https://github.com/ctrf-io/slack-ctrf|Slack Test Reporter> by <https://ctrf.io|CTRF  :green_heart:>"
      }
    ]
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: color,
        blocks: blocks
      }
    ]
  };
};

export const formatFailedTestSummary = (test: CtrfTest, environment: CtrfEnvironment | undefined, options?: Options): object | null => {
  const { name, message, status } = test;
  const charLimit = 2950;
  const trimmedNotice = "\n:warning: Message trimmed as too long for Slack";
  const color = '#FF0000';

  if (status !== "failed") {
    return null;
  }

  let title = options?.title ? options?.title : `Failed Test summary`;
  let missingEnvProperties: string[] = [];
  let prefix = options?.prefix ? options.prefix : null;
  let suffix = options?.suffix ? options.suffix : null;

  let buildInfo = "*Build:* No build information provided";
  if (environment) {
    const { buildName, buildNumber, buildUrl } = environment;

    if (buildName && buildNumber) {
      const buildText = buildUrl ? `<${buildUrl}|${buildName} #${buildNumber}>` : `${buildName} #${buildNumber}`;
      buildInfo = `*Build:* ${buildText}`;
    } else if (buildName || buildNumber) {
      buildInfo = `*Build:* ${buildName || ''} ${buildNumber || ''}`;
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

  const enrichedMessage = message && message.length > charLimit
    ? message.substring(0, charLimit - trimmedNotice.length) + trimmedNotice
    : (message || "No message provided");

  const failSummaryText = `*Message:* ${enrichedMessage}`;

  const blocks: any[] = []
  blocks.push(
    {
      type: "header",
      text: {
        type: "plain_text",
        text: title,
        emoji: true
      }
    })

    if (prefix) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: prefix
        }
      });
    }

    blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Test Name:* ${name}`
      }
    })

    blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${failSummaryText}`
      }
    })

    blocks.push(
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${buildInfo}`
      }
    })

    if (suffix) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: suffix
        }
      });
    }

  if (missingEnvProperties.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: Missing environment properties: ${missingEnvProperties.join(', ')}. Add these to your test for a better experience.`
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "<https://github.com/ctrf-io/slack-ctrf|Slack Test Reporter> by <https://ctrf.io|CTRF  :green_heart:>"
      }
    ]
  });

  const notification: string[] = []
  notification.push(title)

  if (environment) {
    const { buildName, buildNumber } = environment;
    if (buildName && buildNumber) {
      notification.push(`${buildName} #${buildNumber}`)
    }
  }

  notification.push(name)

  return {
    attachments: [
      {
        fallback: notification.join('\n'),
        color: color,
        blocks: blocks
      }
    ]
  };
};






