import type { Assertion, AssertionSet, TestCase } from "promptfoo";
import type { BuildPromptParameters } from "../../index.js";
import { breakingChangesAndErrorsTestCase } from "./breaking-changes-and-errors/index.js";
import { dependencyDeletionTestCase } from "./dependency-deletion/index.js";
import { fileDeletionTestCase } from "./file-deletion/index.js";
import { newFileTestCase } from "./new-file/index.js";
import { subtleErrorsTestCase } from "./subtle-errors/index.js";


export const commonAsserts: (AssertionSet | Assertion)[] = [
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
        breakingChangesAndErrorsTestCase,
        dependencyDeletionTestCase,
        fileDeletionTestCase,
        newFileTestCase,
        subtleErrorsTestCase,
    ]