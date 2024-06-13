import type { Assertion, AssertionSet, TestCase } from "promptfoo";
import { breakingChangesAndErrorsChanges } from "./breaking-changes-and-errors/changes.js";
import breakingChangesAndErrorsOldFiles from "./breaking-changes-and-errors/oldFiles.js";
import type { BuildPromptParameters } from "../../index.js";
import newFileOldFiles from "./new-file/oldFiles.js";
import { newFileChanges } from "./new-file/changes.js";
import fileDeletionOldFiles from "./file-deletion/oldFiles.js";
import { fileDeletionChanges } from "./file-deletion/changes.js";
import subtleErrorsOldFiles from "./subtle-errors/oldFiles.js";
import { subtleErrorsChanges } from "./subtle-errors/changes.js";


const commonAsserts: (AssertionSet | Assertion)[] = [
    {
        type: "model-graded-closedqa",
        value: "ensure that the output is in Markdown format"
    },
    {
        type: "model-graded-closedqa",
        value: "ensure that the output summarizes the changes in a succinct bullet point list"
    },
    {
        type: "model-graded-closedqa",
        value: "ensure that the output includes a subheading and/or bullet point for clearness and understandability of the code"
    },
    {
        type: "model-graded-closedqa",
        value: "ensure that the output includes a subheading and/or bullet point for comments and descriptive names, even if empty"
    },
    {
        type: "model-graded-closedqa",
        value: "ensure that the output includes a subheading and/or bullet point for simplification, even if empty"
    },
    {
        type: "model-graded-closedqa",
        value: "ensure that the output includes a subheading and/or bullet point for bug reports, even if empty"
    },
    {
        type: "model-graded-closedqa",
        value: "ensure that the output includes a subheading and/or bullet point for security issues, even if empty"
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
        {
            description: `new file`,
            vars: {
                oldFiles: newFileOldFiles,
                changes: newFileChanges,
            },
            assert: [
                ...commonAsserts,
            ],
        },
        {
            description: `file deletion`,
            vars: {
                oldFiles: fileDeletionOldFiles,
                changes: fileDeletionChanges,
            },
            assert: [
                ...commonAsserts,
            ],
        },
        {
            description: `subtle errors`,
            vars: {
                oldFiles: subtleErrorsOldFiles,
                changes: subtleErrorsChanges,
            },
            assert: [
                ...commonAsserts,
            ],
        },
    ]