import type { BuildPromptParameters } from "../../../src/prompt/index.js"

const diff = `
diff --git a/subtle-errors/search.ts b/subtle-errors/searchEdited.ts
index 0ed552c..1a1446e 100644
--- a/subtle-errors/search.ts
+++ b/subtle-errors/searchEdited.ts
@@ -2,7 +2,7 @@
 export function search(nums: number[], target: number): number {
     let l = 0, r = nums.length - 1
     while (r >= l) {
-        let i = l + Math.floor((r - l) / 2)
+        let i = l + Math.floor((r - l + 1) / 2)
         if (target === nums[i]) return i
         if (target > (nums[i] ?? 0)) {
             l = i + 1

`

const changes: BuildPromptParameters['changes'] = [
    {
        diff
    }
]

export default changes  