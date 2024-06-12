# Express Speech Processing App

This is a Node.js application built with Express that provides various functionalities for speech processing. It utilizes several APIs and services including Google Cloud Speech-to-Text, OpenAI Chat Completions, and Resemble.ai for audio generation.

## Features

- **Real-time Speech Transcription:** Utilizes Google Cloud Speech-to-Text for converting speech into text in real-time.
- **Chat Completion:** Employs OpenAI's GPT model to provide chat completions based on user messages.
- **Audio Clip Generation:** Generates audio clips from text using Resemble.ai's API.

## Prerequisites

Before running the application, make sure you have the following set up:

- Node.js installed on your machine
- Access to Google Cloud Speech-to-Text API and its credentials
- OpenAI API key
- Resemble.ai API key and project ID

## Installation

1. Clone this repository to your local machine.
2. Install dependencies using npm:

    ```
    npm install
    ```

3. Set up environment variables by creating a `.env` file at the root of the project and adding the following variables:

    ```
    OPENAI_API_KEY=YOUR_OPENAI_API_KEY
    RESEMBLE_PROJECT=YOUR_RESEMBLE_PROJECT_ID
    RESEMBLE_API_KEY=YOUR_RESEMBLE_API_KEY
    RESEMBLE_VOICE_ID=YOUR_RESEMBLE_VOICE_ID
    GOOGLE_APPLICATION_CREDENTIALS=PATH_TO_YOUR_GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY
    ```

4. Replace `PATH_TO_YOUR_GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY` with the path to your Google Cloud service account key file. Speech to text needs to be enabled on the account.

## Usage

Start the server by running:

```bash
npm start
```


The server will start running on port 3000 by default. You can access the application by navigating to `http://localhost:3000` in your web browser.

## Endpoints

- `GET /`: Renders the index page.
- `GET /audio_clip`: Generates an audio clip from text. Requires a query parameter `text`.
- `POST /chat_completion`: Completes chat messages using OpenAI's GPT model. Expects a JSON object with a `messages` array.

## WebSocket Integration

The application uses Socket.IO for WebSocket integration to provide real-time speech transcription. It utilizes Google Cloud Speech-to-Text streaming recognition to transcribe speech as it's received.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

