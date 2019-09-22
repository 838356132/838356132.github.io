#!/bin/bash

# Reference: https://github.com/tuna/blogroll/blob/master/.build/push.sh

if [[ $TRAVIS_BRANCH != "master" ]] || [[ $TRAVIS_REPO_SLUG != "mikukonai/mikukonai.github.io" ]]; then
  echo "Skip deployment"
  exit 0
fi

# Reference: https://gist.github.com/willprice/e07efd73fb7f13f917ea

scriptpath=$(readlink "$0")
basedir=$(dirname $(dirname "$scriptpath"))

cd "$basedir"

git config --global user.email "ci@travis-ci.org"
git config --global user.name "Travis CI"

git remote add origin-travis https://${GITHUB_TOKEN}@github.com/${TRAVIS_REPO_SLUG}


git fetch origin-travis
git add feed.xml
git stash

git checkout origin-travis/master || git checkout --orphan master
git checkout stash -- feed.xml
git reset
git add feed.xml
git commit -m "RSS自动生成"
git push origin-travis HEAD:master
