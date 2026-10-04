// IndexedDB-shaped transaction adapter; this is not an actual browser IDB test.
const test=require('node:test'),assert=require('node:assert/strict'),{environment}=require('./harness.cjs'),tick=()=>new Promise(r=>setImmediate(r));
function adapter(){
 const records=new Map();let fail=false;
 return {records,get fail(){return fail;},set fail(v){fail=v;},db:{
  transaction(){
   const pending=new Map(records);
   const tx={error:null,objectStore(){return {
    put(v,k){pending.set(k,JSON.parse(JSON.stringify(v)));},
    get(k){const q={};setImmediate(()=>{q.result=records.get(k);q.onsuccess?.();});return q;},
    getAll(){const q={};setImmediate(()=>{q.result=[...records.values()];q.onsuccess?.();});return q;}
   };}};
   setImmediate(()=>{if(fail){tx.error=Error('Transaction aborted');tx.onerror?.();}else{records.clear();for(const pair of pending)records.set(...pair);tx.oncomplete?.();}});
   return tx;
  }
 }};
}
test('IndexedDB controller batches current, slot and recovery atomically',async()=>{const e=environment();await tick();const a=adapter();e.c.testDB=a.db;e.run("db=testDB;edit(()=>{doc.name='Version A';addObject('A',K.box(2,3,4));})");await e.run('save()');const pid=e.run('doc.projectId');e.run("edit(()=>doc.name='Version B')");await e.run('save()');assert.equal(a.records.get('current').name,'Version B');assert.equal(a.records.get('project:'+pid).data.name,'Version B');assert.equal(a.records.get('recovery:'+pid).name,'Version A');const rows=await e.run('allRecords()');assert.equal(rows.length,1);});
test('failed IndexedDB transaction preserves last commit and leaves edits dirty',async()=>{const e=environment();await tick();const a=adapter();e.c.testDB=a.db;e.run("db=testDB;edit(()=>doc.name='Committed')");await e.run('save()');a.fail=true;e.run("edit(()=>doc.name='Unsaved')");await e.run('save()');assert.equal(a.records.get('current').name,'Committed');assert.equal(e.run('doc.name'),'Unsaved');assert.equal(e.run('dirty'),true);assert.equal(await e.run('saveBeforeSwitch()'),false);});
