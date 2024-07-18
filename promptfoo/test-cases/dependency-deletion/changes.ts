import type { BuildPromptParameters } from '../../../src/prompt/index.js'

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

const diff2 = `
diff --git a/dependency-deletion/dataset.ts b/dependency-deletion/datasetEdited.ts
index 7337bd8..8a117cb 100644
--- a/dependency-deletion/dataset.ts
+++ b/dependency-deletion/datasetEdited.ts
@@ -1,5 +1,5 @@
 import { search } from "./search.js"
 
-const dataset = new Array(100).fill(0).map((_, i) => i).sort(() => Math.random() - 0.5)
+const dataset = new Array(1000).fill(0).map((_, i) => i).sort(() => Math.random() - 0.5)
 
 export const whereIs13 = search(dataset, 13)
`

const changes: BuildPromptParameters['changes'] = [
  {
    diff
  },
  {
    diff: diff2
  }
]

export default changes
