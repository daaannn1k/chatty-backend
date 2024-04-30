#!/bin/bash

aws s3 sync s3://chatapp-env-files-vvd/production .
unzip env-file.zip
cp .env.production .env
rm .env.production
sed -i -e "s|\(^REDIS_HOST=\).*|REDIS_HOST=redis://$ELASTICACHE_ENDPOINT:6379|g" .env
rm -rf env-file.zip
cp .env .env.production
zip env-file.zip .env.production
aws --region eu-west-1 s3 cp env-file.zip s3://chatapp-env-files-vvd/production/
rm -rf .env*
rm -rf env-file.zip
