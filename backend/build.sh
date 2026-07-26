#!/usr/bin/env bash
# Render Build Script for Django Backend
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
