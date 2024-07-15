import promptfoo from 'promptfoo'
import { promptTestSuite } from './testSuite.js'
import { writeFileSync } from 'node:fs';

(async () => {
    const results = await promptfoo.evaluate(promptTestSuite)
    const resultsString = JSON.stringify(results, null, 2);

    writeFileSync('promptfoo/promptfoo_results.json', resultsString);
    console.log('Wrote promptfoo_results.json');
})()
