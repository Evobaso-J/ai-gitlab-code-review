import type { BuildPromptParameters } from '../../../src/prompt/index.js'

const diff = `
diff --git a/search.ts b/search.ts
index 0ed552c..83b21ef 100644
--- a/search.ts
+++ b/searchEdited.ts
@@ -4,8 +4,7 @@ export function search(nums: number[], target: number): number {
     while (r >= l) {
         let i = l + Math.floor((r - l) / 2)
         if (target === nums[i]) return i
-        if (target > (nums[i] ?? 0)) {
-            l = i + 1
+        if (target >
         } else {
             r = i - 1
         }
`

const changes: BuildPromptParameters['changes'] = [
  {
    diff
  }
]

export default changes
