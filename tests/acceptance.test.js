import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
import {REGIONS} from '../data/regions.js';
import {CHARACTERS} from '../data/characters.js';
import {QUESTIONS_WEST} from '../data/questions-west.js';
import {QUESTIONS_EAST} from '../data/questions-east.js';
import {QUESTIONS_NODKRAI} from '../data/questions-nodkrai.js';
import * as engine from '../engine.js';
import {runChecks} from './checks.js';
import {runUIChecks} from './ui-checks.js';
import {readFile} from 'node:fs/promises';
import {DIMENSIONS,getRegion} from '../data/regions.js';
import {icon,landscape,atlas} from '../art.js';

test('350 questions, independent region pools, scoring, persistence and data contracts',()=>{
  const report=runChecks({REGIONS,CHARACTERS,QUESTIONS:{...QUESTIONS_WEST,...QUESTIONS_EAST,...QUESTIONS_NODKRAI},...engine});
  assert.equal(report.questions,350);
  console.log(JSON.stringify(report,null,2));
});
test('key gate accepts normalization and rejects incorrect keys',async()=>{
  const region={keyHash:createHash('sha256').update('TEST-KEY').digest('hex')};
  assert.equal(await engine.verifyKey(region,'  test-key  ',webcrypto),true);
  assert.equal(await engine.verifyKey(region,'WRONG-KEY',webcrypto),false);
  assert.equal(await engine.verifyKey(region,'',webcrypto),false);
});
test('seven local journeys: gates, five question types, checkpoints, save/reload and review',async()=>{
  const appSource=await readFile(new URL('../app.js',import.meta.url),'utf8');
  const report=await runUIChecks({REGIONS,DIMENSIONS,getRegion,CHARACTERS,QUESTIONS_WEST,QUESTIONS_EAST,QUESTIONS_NODKRAI,...engine,icon,landscape,atlas,verifyKey:async(region,value)=>value==='TEST-'+region.id},appSource);
  assert.equal(report.journeys.length,7);
  console.log(JSON.stringify(report,null,2));
});
test('phone result fixture preserves the real long-name character match',async()=>{
  const fixture=JSON.parse(await readFile(new URL('./mobile-result-fixture.json',import.meta.url),'utf8'));
  const questions={...QUESTIONS_WEST,...QUESTIONS_EAST,...QUESTIONS_NODKRAI}[fixture.region];
  const vector=engine.scoreAnswers(questions,fixture.answers).vector;
  assert.equal(engine.matchCharacters(fixture.region,vector,CHARACTERS)[0].character.id,fixture.character);
});
