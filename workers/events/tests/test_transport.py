import unittest
from ingestion.transport import WireRequest, _send_once, _unique_object, _reject_constant, get_provider

class TransportTests(unittest.TestCase):
    def test_unapproved_endpoint_never_connects(self):
        for url in ['http://api.deepseek.com/chat/completions','https://example.test/chat/completions','https://api.deepseek.com/chat/completions?redirect=1']:
            with self.assertRaises(ValueError):
                _send_once(WireRequest('deepseek',url,{}),'synthetic')
    def test_duplicate_and_nonfinite_fields_rejected(self):
        with self.assertRaises(ValueError): _unique_object([('a',1),('a',2)])
        with self.assertRaises(ValueError): _reject_constant('NaN')
    def test_decode_complete_response_only(self):
        provider=get_provider('deepseek')
        self.assertEqual(provider.decode({'model':'fixture','choices':[{'finish_reason':'stop','message':{'content':'{}'}}]}).status,'ok')
        self.assertEqual(provider.decode({'model':'fixture','choices':[{'finish_reason':'length','message':{'content':'{}'}}]}).status,'invalid')
        with self.assertRaises(ValueError): get_provider('other')
