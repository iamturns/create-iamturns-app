---
to: .github/workflows/formatter.yml
---
name: Formatter

on: push

jobs:
  main:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: 14.x

      - name: Install deps
        run: npm ci

      - name: Format
        run: npm run format

      - name: Commit formatted files
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "chore: Fix formatting"
