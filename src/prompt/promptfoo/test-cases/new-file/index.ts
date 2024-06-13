import type { TestCase } from "promptfoo";
import { commonAsserts } from "../utils.js";
import changes from "./changes.js";
import oldFiles from "./oldFiles.js";
import type { BuildPromptParameters } from "../../../index.js";

export const newFileTestCase: TestCase<BuildPromptParameters> = {
    description: `new file`,
    vars: {
        oldFiles,
        changes,
    },
    assert: [
        ...commonAsserts,
        {
            type: "model-graded-closedqa",
            value: "ensure that the output recognizes the addition of a new file and reviews its contents"
        }
    ],
}
