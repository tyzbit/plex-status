#!/bin/sh
while true; do
  node /plex-status.js
  sleep 60 &
  pid=$?
  trap "kill $pid" SIGTERM
  wait
done
