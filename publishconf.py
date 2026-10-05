from pathlib import Path
import sys

# Pelican loads this settings file without adding the project root to sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pelicanconf import *

SITEURL = 'https://mohammadbashiri.github.io'
