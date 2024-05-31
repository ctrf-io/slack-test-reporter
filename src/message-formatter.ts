import { CtrfReport } from '../types/ctrf';

export const formatResultsMessage = (ctrf: CtrfReport): object => {
    const { summary, environment } = ctrf.results;
    const totalTests = summary.tests;
    const passedTests = summary.passed;
    const failedTests = summary.failed;
    const skippedTests = summary.skipped;
    const pendingTests = summary.pending;
    const otherTests = summary.other;

    const passedPercentage = ((passedTests / totalTests) * 100).toFixed(2);
    const failedPercentage = ((failedTests / totalTests) * 100).toFixed(2);
    const skippedPercentage = ((skippedTests / totalTests) * 100).toFixed(2);
    const pendingPercentage = ((pendingTests / totalTests) * 100).toFixed(2);
    const otherPercentage = ((otherTests / totalTests) * 100).toFixed(2);

    let title = "Test Results - No build details provided";
    let missingEnvProperties: string[] = [];

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
                    text: `:question: *Tests:* ${totalTests}
  :white_check_mark: *Passed:* ${passedTests} (${passedPercentage}%)
  :x: *Failed:* ${failedTests} (${failedPercentage}%)
  :fast_forward: *Skipped:* ${skippedPercentage}
  :hourglass_flowing_sand: *Pending:* ${pendingTests} (${pendingPercentage}%)
  :question: *Other:* ${otherTests} (${otherPercentage}%)`
                }
            ]
        }
    ];

    if (environment) {
        const { buildName, buildNumber, buildUrl } = environment;

        if (buildName && buildNumber) {
            title = `Test Results - ${buildName} #${buildNumber}`;
        } else if (buildName || buildNumber) {
            title = `Test Results - ${buildName || ''} #${buildNumber || ''}`;
        }

        blocks[0].text.text = title;

        if (!buildName) {
            missingEnvProperties.push('buildName');
        }

        if (!buildNumber) {
            missingEnvProperties.push('buildNumber');
        }

        if (buildUrl) {
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
                        url: buildUrl
                    }
                ]
            });
        } else {
            missingEnvProperties.push('buildUrl');
        }
    } else {
        missingEnvProperties = ['buildName', 'buildNumber', 'buildUrl'];
    }

    if (missingEnvProperties.length > 0) {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:warning: The following environment properties are missing: ${missingEnvProperties.join(', ')}. Add these environment details to your CTRF report for a better experience.`
            }
        });
    }

    return { blocks };
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
