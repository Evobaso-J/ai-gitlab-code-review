import promptfoo from 'promptfoo'
import { promptTestCases } from './cases.js'
import { writeFileSync } from 'node:fs';

(async () => {
    const results = await promptfoo.evaluate(promptTestCases)
    console.log('RESULTS:');
    const resultsString = JSON.stringify(results, null, 2);
    console.log(resultsString);

    writeFileSync('src/prompt/test/prompt-test-dataset.json', resultsString);
    console.log('Wrote prompt-test-dataset.json');
})()
