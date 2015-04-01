#!/usr/bin/env python

import json
import os.path
import requests
import subprocess
import sys
import yaml

filename = '/Users/andrew/vagrant/puppet/hieradata/local.yaml'
data_key = 'local::extrawikis::wikis'

if os.path.isfile(filename):
    with open(filename) as f:
        data = yaml.safe_load(f)
else:
    data = {}

wikis_json_text = requests.get('http://127.0.0.1:5000/api/wikis').text
wikis_data = json.loads(wikis_json_text)
if wikis_data['wikis']:
    data[data_key] = wikis_data['wikis']

with open(filename, 'w') as f:
    yaml.safe_dump(data, f, encoding='utf-8', allow_unicode=True)

print("Hiera configuration successfully updated.")
print("Run vagrant provision to apply changes.")
