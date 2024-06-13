import type { EvaluateTestSuite } from "promptfoo";
import { buildPrompt, type BuildPromptParameters } from "../index.js";
import { promptfooTests } from "./test-cases/index.js";

const prompts: EvaluateTestSuite['prompts'] = [
    ({ vars }: { vars: BuildPromptParameters }) => buildPrompt(vars)
]

const providers: EvaluateTestSuite['providers'] = [
    // {
    //     id: "openai:gpt-4",
    // },
    {
        id: "openai:gpt-4o",
    },
]

export const promptTestSuite: EvaluateTestSuite = {
    description: "My first eval",
    prompts,
    providers,
    tests: promptfooTests,
    writeLatestResults: true
}
