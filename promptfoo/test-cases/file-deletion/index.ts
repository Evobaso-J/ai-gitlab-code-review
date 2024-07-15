import type { TestCase } from "promptfoo";
import { commonAsserts } from "../utils.js";
import changes from "./changes.js";
import oldFiles from "./oldFiles.js";
import type { BuildPromptParameters } from "../../../src/prompt/index.js";

export const fileDeletionTestCase: TestCase<BuildPromptParameters> = {
    description: `file deletion`,
    vars: {
        oldFiles,
        changes,
    },
    assert: [
        ...commonAsserts,
        {
            type: "model-graded-closedqa",
            value: "ensure that the output recognizes the deletion of file and understands the implications of the deletion"
        }
    ],
}