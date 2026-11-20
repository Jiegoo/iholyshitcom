import unittest
from ingestion.hot_event_model import build_request, validate_proposal

ARTICLES = [{'id':str(n), 'title':'Title', 'summary':'Summary'} for n in range(3)]
PROPOSAL = {'ids':['0','1','2'],'zh_title':'标题','en_title':'Title',
            'zh_summary':'第一句。第二句。第三句。','en_summary':'First. Second. Third.'}

class HotEventModelTests(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(validate_proposal(PROPOSAL, ARTICLES), PROPOSAL)
        self.assertEqual(build_request(ARTICLES, 'model').provider, 'deepseek')
    def test_prompt_keeps_only_bounded_public_fields(self):
        article = {'id':'0','title':'字'*500,'summary':'文'*500,'unused':'private'}
        request = build_request([article,{**article,'id':'1'},{**article,'id':'2'}], 'model')
        self.assertNotIn('private', request.body['messages'][1]['content'])
        self.assertLess(len(request.body['messages'][1]['content'].encode('utf-8')), 2500)
    def test_rejects_unknown_and_duplicate_ids(self):
        for ids in (['0','1','9'], ['0','1','1'], ['1','2']):
            with self.assertRaises(ValueError): validate_proposal({**PROPOSAL, 'ids':ids}, ARTICLES)
    def test_requires_three_sentences(self):
        with self.assertRaises(ValueError): validate_proposal({**PROPOSAL,'zh_summary':'只有一句。'}, ARTICLES)
    def test_insufficient_cluster_has_no_published_summary(self):
        self.assertEqual(validate_proposal({'ids':['0','1']}, ARTICLES), {'ids':['0','1']})

if __name__ == '__main__': unittest.main()
