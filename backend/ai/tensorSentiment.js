/**
 * Lightweight TensorFlow.js utility for numeric sentiment features.
 * Complements natural's AFINN analyzer — no cloud APIs.
 */
const tf = require('@tensorflow/tfjs');

const tokenizeSimple = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
};

const buildFeatureVector = (text) => {
  const tokens = tokenizeSimple(text);
  const len = tokens.length;
  const positive = ['good', 'great', 'thanks', 'secure', 'safe', 'helpful'];
  const negative = ['bad', 'hack', 'breach', 'worried', 'scared', 'attack', 'stolen'];
  let pos = 0;
  let neg = 0;
  tokens.forEach((t) => {
    if (positive.includes(t)) pos += 1;
    if (negative.includes(t)) neg += 1;
  });
  return tf.tensor2d([[len, pos, neg, pos - neg]], [1, 4]);
};

const scoreWithTensor = (text) => {
  const vec = buildFeatureVector(text);
  const weights = tf.tensor2d([[0.01, 0.3, -0.35, 0.5]], [1, 4]);
  const score = vec.matMul(weights.transpose()).dataSync()[0];
  vec.dispose();
  weights.dispose();
  return score;
};

module.exports = { scoreWithTensor, buildFeatureVector };
