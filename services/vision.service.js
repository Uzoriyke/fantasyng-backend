const axios = require('axios');
const fs = require('fs');
const path = require('path');

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

const imgToBase64 = (filePath) => {
  const full = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full).toString('base64');
};

const callVision = async (imageContent, features) => {
  const r = await axios.post(VISION_URL + '?key=' + process.env.GOOGLE_VISION_API_KEY, {
    requests: [{ image: { content: imageContent }, features }]
  });
  return r.data.responses[0];
};

const checkBlueBadge = async (photoPath) => {
  const content = imgToBase64(photoPath);
  if (!content) return { hasFace: false, hasFantasyNGText: false };
  const result = await callVision(content, [
    { type: 'FACE_DETECTION', maxResults: 5 },
    { type: 'TEXT_DETECTION', maxResults: 10 }
  ]);
  const faces = result.faceAnnotations || [];
  const texts = result.textAnnotations || [];
  const hasFace = faces.length > 0 && faces[0].detectionConfidence > 0.8;
  const allText = texts.map(t => t.description.toLowerCase()).join(' ');
  const hasFantasyNGText = allText.includes('fantasyng');
  return { hasFace, hasFantasyNGText };
};

const checkRedBadge = async (videoPath) => {
  const content = imgToBase64(videoPath);
  if (!content) return { hasFace: false };
  const result = await callVision(content, [{ type: 'FACE_DETECTION', maxResults: 5 }]);
  const faces = result.faceAnnotations || [];
  return { hasFace: faces.length > 0 && faces[0].detectionConfidence > 0.85 };
};

const checkGoldenBadge = async (videoPath, idPath) => {
  const idContent = imgToBase64(idPath);
  if (!idContent) return { idValid: false, faceMatches: false, isAdult: false };
  const result = await callVision(idContent, [{ type: 'DOCUMENT_TEXT_DETECTION' }, { type: 'FACE_DETECTION' }]);
  const idText = result.fullTextAnnotation ? result.fullTextAnnotation.text : '';
  const idFaces = result.faceAnnotations || [];
  const idValid = idText.length > 50 && idFaces.length > 0;
  const yearMatches = idText.match(/\b(19[5-9]\d|200[0-6])\b/g);
  const isAdult = yearMatches ? (new Date().getFullYear() - parseInt(yearMatches[0])) >= 18 : false;
  return { idValid, faceMatches: idFaces.length > 0, isAdult };
};

module.exports = { checkBlueBadge, checkRedBadge, checkGoldenBadge };
