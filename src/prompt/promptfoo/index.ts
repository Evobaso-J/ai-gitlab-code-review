import promptfoo from 'promptfoo'
import { promptTestSuite } from './test-suite.js'
import { writeFileSync } from 'node:fs';

(async () => {
    const results = await promptfoo.evaluate(promptTestSuite)
    const resultsString = JSON.stringify(results, null, 2);

    writeFileSync('src/prompt/promptfoo/prompt-test-dataset.json', resultsString);
    console.log('Wrote prompt-test-dataset.json');
})()
