#!/usr/bin/env bash

if [ -d dist/ ]
then
    rm -rf dist/
fi

npm run build:prod

cp staticwebapp.config.json dist/

cp src/errors/404.html dist/

python3 postprocessing.py
