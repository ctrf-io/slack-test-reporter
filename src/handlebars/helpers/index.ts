import {
  convertTimestamp,
  escapeMarkdownHelper,
  sliceStringHelper,
  splitLinesHelper,
} from './string'
import {
  anyFailedTestsHelper,
  anyFlakyTestsHelper,
  anySkippedTestsHelper,
  countFlakyHelper,
  equalsHelper,
  formatDurationMsToHumanHelper,
  formatDurationStartStopToHumanHelper,
  formatRateHelper,
  LimitFailedTests,
  moreThanHelper,
  sortTestsByFailRateHelper,
  sortTestsByFlakyRateHelper,
} from './ctrf'
import { formatMessageHelper, stripAnsiHelper } from './ansi'
import { sliceArrayHelper } from './array'

export function registerAllHelpers(): void {
  formatDurationStartStopToHumanHelper()
  countFlakyHelper()
  stripAnsiHelper()
  equalsHelper()
  formatDurationMsToHumanHelper()
  formatMessageHelper()
  LimitFailedTests()
  moreThanHelper()
  sortTestsByFlakyRateHelper()
  formatRateHelper()
  sortTestsByFailRateHelper()
  sliceArrayHelper()
  escapeMarkdownHelper()
  splitLinesHelper()
  sliceStringHelper()
  convertTimestamp()
  anyFlakyTestsHelper()
  anyFailedTestsHelper()
  anySkippedTestsHelper()
}
