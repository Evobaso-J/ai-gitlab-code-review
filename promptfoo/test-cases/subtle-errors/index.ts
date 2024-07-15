import type { TestCase } from "promptfoo";
import { commonAsserts } from "../utils.js";
import changes from "./changes.js";
import oldFiles from "./oldFiles.js";
import type { BuildPromptParameters } from "../../../src/prompt/index.js";

export const subtleErrorsTestCase: TestCase<BuildPromptParameters> = {
    description: `subtle errors`,
    vars: {
        oldFiles,
        changes,
    },
    assert: [
        ...commonAsserts,
        {
            type: "model-graded-closedqa",
            value: "ensure that the output catches the presence of a bug"
        }
    ],
}
