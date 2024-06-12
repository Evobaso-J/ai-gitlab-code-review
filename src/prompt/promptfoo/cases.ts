import type { EvaluateTestSuite } from "promptfoo";

const prompts: EvaluateTestSuite['prompts'] = [
    "Write a tweet about {{topic}}",
    "Write a very concise, funny tweet about {{topic}}"
]

const providers: EvaluateTestSuite['providers'] = [
    {
        id: "openai:gpt-3.5-turbo-0613",
    },
]

const tests: EvaluateTestSuite['tests'] = [
    {
        vars: {
            topic: "bananas"
        }
    },
    {
        vars: {
            topic: "avocado toast"
        },
        assert: [
            {
                type: "icontains",
                value: "avocado"
            },
            {
                type: "javascript",
                value: '1 / (output.length + 1)'  // prefer shorter outputs
            }
        ]
    },
    {
        vars: {
            topic: "new york city"
        },
        assert: [
            {
                type: "llm-rubric",
                value: "ensure that the output is funny"
            }
        ]
    },
]


export const promptTestCases: EvaluateTestSuite = {
    description: "My first eval",
    prompts,
    providers,
    tests,
    writeLatestResults: true
}
