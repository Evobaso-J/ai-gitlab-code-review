import type { EvaluateTestSuite, TestCase } from "promptfoo";
import { buildPrompt, type BuildPromptParameters } from "../index.js";
import { breakingChangesAndErrorsTestCase } from "./test-cases/breaking-changes-and-errors/index.js";
import { dependencyDeletionTestCase } from "./test-cases/dependency-deletion/index.js";
import { fileDeletionTestCase } from "./test-cases/file-deletion/index.js";
import { newFileTestCase } from "./test-cases/new-file/index.js";
import { subtleErrorsTestCase } from "./test-cases/subtle-errors/index.js";

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

const tests: TestCase<
    BuildPromptParameters
>[] = [
        breakingChangesAndErrorsTestCase,
        dependencyDeletionTestCase,
        fileDeletionTestCase,
        newFileTestCase,
        subtleErrorsTestCase,
    ]

export const promptTestSuite: EvaluateTestSuite = {
    description: "Code review eval",
    prompts,
    providers,
    tests,
    writeLatestResults: true
}
