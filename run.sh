#!/bin/bash

source venv/bin/activate

venv/bin/gunicorn server:app -b '[::]:5000' -w 5 -t 600
