import type { BuildPromptParameters } from "../../../index.js"


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


const breakingChangesAndErrorsOldFiles: BuildPromptParameters['oldFiles'] = [
    {
        fileName: "search.ts",
        fileContent
    }
]

export default breakingChangesAndErrorsOldFiles