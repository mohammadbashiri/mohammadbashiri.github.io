AUTHOR = 'Mohammad Bashiri'
SITENAME = 'Mohammad Bashiri'
SITEURL = ''
PATH = 'content'
TIMEZONE = 'Europe/Berlin'
DEFAULT_LANG = 'en'
THEME = 'themes/simple'

# Retained themes: 'neon-blue' (current) and 'mint' (Original mint).
FIELD_PALETTE = 'neon-blue'

# Match cached browser assets to the exact files used by each build.
from hashlib import sha256
from pathlib import Path

_STATIC = Path(__file__).resolve().parent / THEME / 'static'

def asset_version(name):
    return sha256((_STATIC / name).read_bytes()).hexdigest()[:12]

JINJA_GLOBALS = {'asset_version': asset_version}