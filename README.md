# AI Code Reviewer

Gitlab AI Code Review is a JS script that leverages OpenAI's GPT-3.5-turbo to automatically review code changes in GitLab repositories. It listens for merge request and push events, fetches the associated code changes, and provides feedback on the changes in a Markdown format.

## Features

- Automatically reviews code changes in GitLab repositories
- Provides feedback on code clarity, simplicity, bugs, and security issues
- Generates Markdown-formatted responses for easy readability in GitLab

### Prerequisites

- Docker
- An OpenAI API key
- A GitLab access token (can be generated in your [GitLab account settings](https://gitlab.com/-/user_settings/ssh_keys))

### Installation

1. Clone the repository:

```
https://github.com/Evobaso-J/ai-gitlab-code-review
cd ai-code-reviewer
```

2. Create a `.env` file by copying the `.env.example` file and set the required environment variables:

```
OPENAI_API_KEY=<your OpenAI API key>
GITLAB_TOKEN=<your GitLab API token>
GITLAB_URL=https://gitlab.com/api/v4
AI_MODEL=<an AI model from the ones supported by OpenAI>
```

- `OPEN_API_KEY` is your ChatGPT account’s key
- `GITLAB_TOKEN` is a personal gitlab account token. You can create it [here](https://gitlab.com/-/user_settings/personal_access_tokens) and it can be either be your own personal token or a token from a gitlab account created _ad hoc_
- `GITLAB_URL` it’s the latest gitlab’s api version url, currently https://gitlab.com/api/v4
- `AI_MODEL` is the model you want to use from OpenAI. You can use `gpt-3.5-turbo` or any other model supported by OpenAI.

### Docker

You can use Docker to run the application:

1. Build the Docker image:

```
docker-compose build
```

2. Run the Docker container:

```
docker-compose up -d
```

## Usage

1. Configure your GitLab repository to send webhook events to the AI Code Reviewer application by following [GitLab's webhook documentation](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html).

2. The AI Code Reviewer application will automatically review code changes in your GitLab repository and provide feedback as comments on merge requests and commit diffs.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
