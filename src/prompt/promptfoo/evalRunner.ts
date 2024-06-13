import promptfoo from 'promptfoo'
import { promptTestSuite } from './testSuite.js'
import { writeFileSync } from 'node:fs';

(async () => {
    const results = await promptfoo.evaluate(promptTestSuite)
    const resultsString = JSON.stringify(results, null, 2);

    writeFileSync('src/prompt/promptfoo/promptTestResults.json', resultsString);
    console.log('Wrote promptTestResults.json');
})()
