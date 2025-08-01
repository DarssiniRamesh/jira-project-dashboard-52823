#!/bin/bash
cd /home/kavia/workspace/code-generation/jira-project-dashboard-52823/jira_dashboard_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

