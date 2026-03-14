import { type Options, type SlackMessage } from '../types/reporter.js';
export interface ISlackClient {
    sendMessage(message: SlackMessage): Promise<string | undefined>;
    addReaction(ts: string, emoji: string): Promise<void>;
}
export declare class SlackClient implements ISlackClient {
    private webClient?;
    private webhook?;
    private options;
    constructor(options: Options);
    sendMessage(message: SlackMessage): Promise<string | undefined>;
    addReaction(ts: string, emoji: string): Promise<void>;
}
//# sourceMappingURL=slack-client.d.ts.map