import fetch from 'node-fetch';

// JIRA Configuration
const JIRA_CONFIG = {
  baseUrl: 'https://zenithive-team.atlassian.net',
  email: 'sachint@zenithive.com', // Replace with your email
  apiToken: 'a', // Replace with your API token
};

// Generate Base64 auth token
const getAuthToken = () => {
  return Buffer.from(`${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`).toString('base64');
};

// Controller function to get all JIRA projects
const getJiraProjects = async (req, res) => {
  try {
    const response = await fetch(`${JIRA_CONFIG.baseUrl}/rest/api/3/project`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${getAuthToken()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch projects from JIRA',
        status: response.status,
        statusText: response.statusText
      });
    }

    const projects = await response.json();
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });

  } catch (error) {
    console.error('Error fetching JIRA projects:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Controller function to get a specific project by key
const getJiraProjectByKey = async (req, res) => {
  try {
    const { projectKey } = req.params;
    
    const response = await fetch(`${JIRA_CONFIG.baseUrl}/rest/api/3/project/${projectKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${getAuthToken()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch project ${projectKey} from JIRA`,
        status: response.status,
        statusText: response.statusText
      });
    }

    const project = await response.json();
    
    res.status(200).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Error fetching JIRA project:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Controller function to get projects with expanded details
const getJiraProjectsWithDetails = async (req, res) => {
  try {
    const expandFields = 'description,lead,issueTypes,url,projectKeys';
    
    const response = await fetch(`${JIRA_CONFIG.baseUrl}/rest/api/3/project?expand=${expandFields}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${getAuthToken()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch detailed projects from JIRA',
        status: response.status,
        statusText: response.statusText
      });
    }

    const projects = await response.json();
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });

  } catch (error) {
    console.error('Error fetching detailed JIRA projects:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};


// Controller function to get issues for a specific project
const getProjectIssues = async (req, res) => {
  try {
    const { projectKey } = req.params;
    const { maxResults = 50, startAt = 0 } = req.query;
    
    // JQL query to get issues from specific project
    const jql = `project = ${projectKey} ORDER BY created DESC`;
    
    const response = await fetch(`${JIRA_CONFIG.baseUrl}/rest/api/3/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${getAuthToken()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql: jql,
        maxResults: parseInt(maxResults),
        startAt: parseInt(startAt),
        fields: [
          'summary',
          'status',
          'assignee',
          'reporter',
          'priority',
          'issuetype',
          'created',
          'updated',
          'description',
          'labels',
          'components'
        ]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch issues for project ${projectKey}`,
        status: response.status,
        statusText: response.statusText
      });
    }

    const issues = await response.json();
    
    res.status(200).json({
      success: true,
      projectKey: projectKey,
      total: issues.total,
      maxResults: issues.maxResults,
      startAt: issues.startAt,
      data: issues.issues
    });

  } catch (error) {
    console.error('Error fetching project issues:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

export {
  getJiraProjects,
  getJiraProjectByKey,
  getJiraProjectsWithDetails,
  getProjectIssues
};