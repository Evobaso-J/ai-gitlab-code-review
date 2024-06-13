import type { BuildPromptParameters } from "../../../index.js";

const diff = `
diff --git a/file-deletion/search.ts b/file-deletion/search.ts
deleted file mode 100644
index 0ed552c..0000000
--- a/file-deletion/search.ts
+++ /dev/null
@@ -1,14 +0,0 @@
-// Binary search algorithm
-export function search(nums: number[], target: number): number {
-    let l = 0, r = nums.length - 1
-    while (r >= l) {
-        let i = l + Math.floor((r - l) / 2)
-        if (target === nums[i]) return i
-        if (target > (nums[i] ?? 0)) {
-            l = i + 1
-        } else {
-            r = i - 1
-        }
-    }
-    return -1
-};

`

const fileDeletionChanges: BuildPromptParameters['changes'] = [
    {
        diff
    }
]

export { fileDeletionChanges } 