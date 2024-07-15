import type { BuildPromptParameters } from "../../../src/prompt/index.js"


const fileContent =
    `
// Binary search algorithm
export function search(nums: number[], target: number): number {
    let l = 0, r = nums.length - 1
    while (r >= l) {
        let i = l + Math.floor((r - l) / 2)
        if (target === nums[i]) return i
        if (target > (nums[i] ?? 0)) {
            l = i + 1
        } else {
            r = i - 1
        }
    }
    return -1
};
`

const fileContent2 = `
import { search } from "./search.js"

const dataset = new Array(100).fill(0).map((_, i) => i).sort(() => Math.random() - 0.5)

export const whereIs13 = search(dataset, 13)
`

const oldFiles: BuildPromptParameters['oldFiles'] = [
    {
        fileName: "search.ts",
        fileContent
    },
    {
        fileName: "dataset.ts",
        fileContent: fileContent2
    }
]

export default oldFiles