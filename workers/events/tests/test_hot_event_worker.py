import unittest
from datetime import datetime, timezone
from uuid import UUID
from ingestion.hot_event_worker import process_one

NOW=datetime.now(timezone.utc).isoformat()
ARTICLES=[{'id':f'manual:{UUID(int=i)}','title':'Robot breakthrough new capability','summary':'A published report',
           'score':80,'published_at':NOW} for i in range(1,4)]
PROPOSAL={'ids':[a['id'] for a in ARTICLES],'zh_title':'标题','en_title':'Title',
          'zh_summary':'第一句。第二句。第三句。','en_summary':'First. Second. Third.'}

class Cursor:
    def __init__(self,db): self.db=db
    def __enter__(self): return self
    def __exit__(self,*args): return False
    def execute(self,query,params=None): self.db.calls.append((query,params))
    def fetchone(self): return (self.db.job,)
class DB:
    def __init__(self,articles):
        self.calls=[]
        self.job={'job_id':'job','attempt':1,'anchor':articles[0]['id'] if articles else 'missing','articles':articles}
    def cursor(self): return Cursor(self)

class HotEventWorkerTests(unittest.TestCase):
    def test_qualified_articles_apply_proposal(self):
        db=DB(ARTICLES)
        self.assertEqual(process_one(db,'model','key',propose=lambda rows,model,key:PROPOSAL),'completed')
        self.assertTrue(any('hot_event_apply' in call[0] for call in db.calls))
    def test_below_threshold_never_calls_model(self):
        db=DB(ARTICLES[:2])
        self.assertEqual(process_one(db,'model','key',propose=lambda *args:self.fail('unexpected model call')),'below_threshold')
        self.assertTrue(any('hot_event_finish_empty' in call[0] for call in db.calls))
    def test_failure_requeues(self):
        db=DB(ARTICLES)
        def fail(*args): raise ValueError('failure')
        with self.assertRaises(ValueError): process_one(db,'model','key',propose=fail)
        self.assertTrue(any('hot_event_retry' in call[0] for call in db.calls))

if __name__=='__main__': unittest.main()
