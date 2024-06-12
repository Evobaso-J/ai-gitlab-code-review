import type { Assertion, AssertionSet, TestCase } from "promptfoo";
import { breakingChangesAndErrorsChanges } from "./breaking-changes-and-errors/changes.js";
import breakingChangesAndErrorsOldFiles from "./breaking-changes-and-errors/oldFiles.js";
import type { BuildPromptParameters } from "../../index.js";


const commonAsserts: (AssertionSet | Assertion)[] = [
    {
        type: "llm-rubric",
        value: "ensure that the output is in Markdown format"
    },
    {
        type: "llm-rubric",
        value: "ensure that the output summarizes the changes in a succinct bullet point list"
    },
    {
        type: "llm-rubric",
        value: "ensure that the output includes a section with suggestions for clearness and understandability of the code"
    },
    {
        type: "llm-rubric",
        value: "ensure that the output includes a section with suggestions for better naming and comments, even if empty"
    },
    {
        type: "llm-rubric",
        value: "ensure that the output includes a section with suggestions for simplification, even if empty"
    },
    {
        type: "llm-rubric",
        value: "ensure that the output includes a section for bug reports, even if empty"
    },
    {
        type: "llm-rubric",
        value: "ensure that the output includes a section with suggestions for security issues, even if empty"
    },

]

export const promptfooTests: TestCase<
    BuildPromptParameters
>[] = [
        {
            description: `breaking changes and errors`,
            vars: {
                oldFiles: breakingChangesAndErrorsOldFiles,
                changes: breakingChangesAndErrorsChanges,
            },
            assert: [
                ...commonAsserts,
            ],
        },
        // { description: "When the old" }
    ]