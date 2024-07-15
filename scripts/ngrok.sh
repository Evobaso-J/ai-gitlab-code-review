#!/bin/bash

# Load the .env file
source .env

docker compose up --build -d

if [ "$NGROK_TEST_DOMAIN" ]; then
    echo "Using ngrok domain: $NGROK_TEST_DOMAIN"
    ngrok http --domain=$NGROK_TEST_DOMAIN http://localhost:9655
else
    ngrok http http://localhost:9655
fi

trap 'docker compose down' SIGINT SIGTERM EXIT