#!/bin/sh

LANG=en_US.UTF-8

python sync-to-hiera.py
labs-vagrant provision
