"""Explicit HTTPS transport for the optional event task. No automatic provider fallback."""
import http.client
import json
from dataclasses import dataclass, field
from types import SimpleNamespace
from urllib.parse import urlsplit

@dataclass(frozen=True)
class WireRequest:
    provider: str
    url: str
    body: dict = field(repr=False)

def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate response field')
        result[key] = value
    return result

def _reject_constant(_value):
    raise ValueError('non-finite response value')

def _send_once(request, credential):
    url = urlsplit(request.url)
    if request.provider != 'deepseek' or url.scheme != 'https' or url.netloc != 'api.deepseek.com' or url.path != '/chat/completions' or url.query or url.fragment:
        raise ValueError('provider endpoint not allowed')
    connection = http.client.HTTPSConnection(url.hostname, timeout=60)
    try:
        connection.request('POST', url.path, json.dumps(request.body).encode(),
                           {'Content-Type':'application/json','Authorization':'Bearer '+credential})
        response = connection.getresponse()
        if response.status != 200:
            return SimpleNamespace(kind='http_error', status=response.status, body=None)
        raw = response.read(2 * 1024 * 1024 + 1)
        if len(raw) > 2 * 1024 * 1024:
            raise ValueError('response too large')
        body = json.loads(raw, object_pairs_hook=_unique_object, parse_constant=_reject_constant)
        return SimpleNamespace(kind='response', status=200, body=body)
    finally:
        connection.close()

class Provider:
    def decode(self, body):
        try:
            choice = body['choices'][0]
            if choice['finish_reason'] != 'stop' or not isinstance(choice['message']['content'], str):
                raise ValueError('incomplete response')
            return SimpleNamespace(status='ok', model=body['model'], content=choice['message']['content'])
        except (KeyError, IndexError, TypeError, ValueError):
            return SimpleNamespace(status='invalid', model=None, content=None)

def get_provider(provider):
    if provider != 'deepseek':
        raise ValueError('unsupported provider')
    return Provider()
