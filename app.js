const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const speech = require('@google-cloud/speech');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RESEMBLE_PROJECT = process.env.RESEMBLE_PROJECT;
const RESEMBLE_API_KEY = process.env.RESEMBLE_API_KEY;
const RESEMBLE_VOICE_ID = process.env.RESEMBLE_VOICE_ID;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index');
});

async function generateAudioClip(text) {
    const url = 'https://f.cluster.resemble.ai/stream';
    const headers = {
        'Authorization': `Bearer ${RESEMBLE_API_KEY}`
    };
    const json_data = {
        "voice_uuid": RESEMBLE_VOICE_ID,
        "project_uuid": RESEMBLE_PROJECT,
        "data": text,
        "precision": "PCM_16",
        'buffer_size': 1024
    };

    const response = await axios.post(url, json_data, { headers, responseType: 'stream' });
    return response.data;
}

app.get('/audio_clip', async (req, res) => {
    const text = req.query.text;
    const audioClipStream = await generateAudioClip(text);
    res.set('Content-Type', 'audio/wav');
    audioClipStream.pipe(res);
});


app.post('/chat_completion', async (req, res) => {
    const jsonData = req.body;

    if (!jsonData.messages || jsonData.messages.length ===0) {
        return res.status(400).json({ error: 'No messages provided' });
    }

    res.setHeader('Content-Type', 'text/plain');

    const url = 'https://api.openai.com/v1/chat/completions';

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
    };
    const data = {
        model: 'gpt-4o',
        messages: jsonData.messages,
        max_tokens: 100,
        stream: true
    };

    try {
        const { data: stream } = await axios.post(url, data, { headers, responseType: 'stream' });
        // Pipe the OpenAI response stream directly to the Express response
        stream.pipe(res);
    } catch (error) {
        console.error('Error while streaming data from OpenAI:', error);
        res.status(500).send('Failed to stream data from OpenAI');
    }
});

// Google Cloud Speech-to-Text Client
const client = new speech.SpeechClient({
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
});

const streams = {};

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    const recognizeStream = client
        .streamingRecognize({
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
            },
            interimResults: true,
        })
        .on('error', (error) => {
            socket.emit('transcriptionError', error.message);
        })
        .on('data', (response) => {
            const transcription =
                response.results[0] && response.results[0].alternatives[0]
                    ? response.results[0].alternatives[0].transcript
                    : 'Transcription not available';
            socket.emit('transcription', transcription);
        });

    streams[socket.id] = recognizeStream;

    socket.on('audioData', (data) => {
        if (streams[socket.id]) {
            streams[socket.id].write(data);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.id);
        if (streams[socket.id]) {
            streams[socket.id].end();
            delete streams[socket.id];
        }
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
