# AEO Auditor — Deployment Guide

An automated tool that audits how visible a brand is across AI answer engines.
For each company, it auto-generates buyer-intent queries, runs them through an AI
answer engine, evaluates brand visibility, and builds a ranked index.

## What's in this folder

- `public/index.html` — the tool's interface (front-end)
- `api/claude.js` — secure serverless function that holds your API key server-side
- `vercel.json` — deployment config

The architecture is deliberate: your API key NEVER touches the browser. The
front-end calls `/api/claude`, and only that server-side function talks to
Anthropic using your secret key. This is the correct, secure way to ship an
AI tool publicly.

## Deploy to Vercel — step by step

### 1. Get an Anthropic API key
- Go to console.anthropic.com
- Sign up / log in
- Add a small amount of credit (e.g. $5) under Billing
- Create an API key under API Keys. Copy it (starts with `sk-ant-`)

### 2. Create free accounts
- github.com (to store the code)
- vercel.com (sign up WITH your GitHub account — makes step 5 one click)

### 3. Put this code on GitHub
- On github.com, click New repository, name it `aeo-auditor`, keep it Private
- Click "uploading an existing file"
- Drag in this whole folder's contents (keep the folder structure: `public/`, `api/`, `vercel.json`)
- Commit

### 4. Set your secrets in Vercel
- In Vercel, click Add New > Project, import your `aeo-auditor` repo
- BEFORE deploying, open Environment Variables and add:
  - `ANTHROPIC_API_KEY` = your `sk-ant-...` key
  - `SITE_PASSWORD` = any password you choose (this gates access so randoms can't run up your bill)

### 5. Deploy
- Click Deploy
- Vercel gives you a live URL like `aeo-auditor.vercel.app`
- Open it, enter your SITE_PASSWORD at the top, and run an audit

## Using it in interviews
- Open your live URL, enter the password
- Type the company you're talking to (plus competitors) in the box
- Hit Run Index, walk them through the findings live

## Cost control
- The SITE_PASSWORD keeps strangers out
- Each full audit is a handful of AI calls (cents, not dollars)
- You can set a spend limit in the Anthropic console under Billing
