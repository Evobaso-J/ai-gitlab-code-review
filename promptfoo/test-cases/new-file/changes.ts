import type { BuildPromptParameters } from '../../../src/prompt/index.js'

const diff = `
diff --git a/search.ts b/search.ts
new file mode 100644
index 0000000..0ed552c
--- /dev/null
+++ b/search.ts
@@ -0,0 +1,14 @@
+// Binary search algorithm
+export function search(nums: number[], target: number): number {
+    let l = 0, r = nums.length - 1
+    while (r >= l) {
+        let i = l + Math.floor((r - l) / 2)
+        if (target === nums[i]) return i
+        if (target > (nums[i] ?? 0)) {
+            l = i + 1
+        } else {
+            r = i - 1
+        }
+    }
+    return -1
+};
`

const changes: BuildPromptParameters['changes'] = [
  {
    diff
  }
]

export default changes
