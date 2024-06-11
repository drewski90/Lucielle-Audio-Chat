const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const FormData = require('form-data');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const upload = multer();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RESEMBLE_PROJECT = process.env.RESEMBLE_PROJECT;
const RESEMBLE_API_KEY = process.env.RESEMBLE_API_KEY;
const RESEMBLE_VOICE_ID = process.env.RESEMBLE_VOICE_ID;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index');
});

async function fetchAudioClip(text) {
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
    const audioClipStream = await fetchAudioClip(text);
    res.set('Content-Type', 'audio/wav');
    audioClipStream.pipe(res);
});

app.post('/upload', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = req.file.buffer;
    const jsonData = req.json || {};
    const result = await processAudio(audioFile, jsonData);
    res.json(result);
});

async function processAudio(audioFile, jsonData) {
    const transcription = await transcribeAudio(audioFile);
    const completion = await getOpenaiCompletion(transcription, jsonData);
    return {
        transcription,
        completion
    };
}

async function transcribeAudio(audioData) {
    const url = 'https://api.openai.com/v1/audio/transcriptions';
    const form = new FormData();
    form.append('file', audioData, {
        filename: 'recording.webm',
        contentType: 'audio/webm'
    });
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities', 'word');

    const response = await axios.post(url, form, {
        headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
    });
    return response.data.text;
}

async function getOpenaiCompletion(prompt, jsonData) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
    };
    const data = {
        model: 'gpt-4-turbo',
        messages: [...(jsonData.messages || []), { role: "user", content: prompt }],
        max_tokens: 100
    };

    const response = await axios.post(url, data, { headers });
    return response.data.choices[0].message.content;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
