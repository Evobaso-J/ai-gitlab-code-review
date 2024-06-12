import type { BuildPromptParameters } from "../../../index.js";

const diff = `
--- search.ts	2024-06-12 23:52:44
+++ search.ts	2024-06-12 23:53:17
@@ -4,8 +4,7 @@
     while (r >= l) {
         let i = l + Math.floor((r - l) / 2)
         if (target === nums[i]) return i
-        if (target > (nums[i] ?? 0)) {
-            l = i + 1
+        if (target >
         } else {
             r = i - 1
         }
\ No newline at end of file
`

const breakingChangesAndErrorsChanges: BuildPromptParameters['changes'] = [
    {
        diff
    }
]

export { breakingChangesAndErrorsChanges } 