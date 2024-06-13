import type { TestCase } from "promptfoo";
import { commonAsserts } from "../index.js";
import changes from "./changes.js";
import oldFiles from "./oldFiles.js";
import type { BuildPromptParameters } from "../../../index.js";

export const dependencyDeletionTestCase: TestCase<BuildPromptParameters> = {
    description: `dependency deletion`,
    vars: {
        oldFiles,
        changes,
    },
    assert: [
        ...commonAsserts,
        {
            type: "model-graded-closedqa",
            value: "ensure that the output recognizes the presence of a bug due to the deletion of an imported file"
        }
    ],
}