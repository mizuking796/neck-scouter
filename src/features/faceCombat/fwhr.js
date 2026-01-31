// 顔幅比指標 (fWHR - Facial Width-to-Height Ratio)
// 頬骨幅 / 顔の高さ（眉下〜上唇）の比率
// ※医学的根拠はなく、あくまでエンターテインメント目的

import { LANDMARKS, normalizeScore, getRank } from './constants'

// 履歴を保持して平均化（安定した計測のため）
const MAX_HISTORY = 30
let fwhrHistory = []

/**
 * fWHRを計算
 * @param {Array} landmarks - 468個のランドマーク
 * @param {number} aspectRatio - キャンバスのアスペクト比（width/height）
 * @returns {Object} - { score, rank, details }
 */
export function calculateFWHR(landmarks, aspectRatio = 4/3) {
  if (!landmarks || landmarks.length < 468) {
    return { score: 50, rank: 'B', details: {} }
  }

  // fWHR値を計算（アスペクト比補正付き）
  const fwhrValue = extractFWHR(landmarks, aspectRatio)

  // 履歴に追加
  fwhrHistory.push(fwhrValue)
  if (fwhrHistory.length > MAX_HISTORY) {
    fwhrHistory.shift()
  }

  // 平均値を使用
  const avgFWHR = fwhrHistory.reduce((a, b) => a + b, 0) / fwhrHistory.length

  // fWHRは通常1.7〜2.1程度（人間の平均的な範囲）
  // 高いほど高スコア（1.5 → 0, 2.1 → 100）
  // 最低5点を保証
  const rawScore = normalizeScore(avgFWHR, 1.5, 2.1)
  const score = Math.max(5, rawScore)

  return {
    score,
    rank: getRank(score),
    details: {
      fwhr: avgFWHR.toFixed(3),
      currentFWHR: fwhrValue.toFixed(3)
    }
  }
}

/**
 * fWHR値を抽出（アスペクト比補正付き）
 * @param {Array} landmarks - ランドマーク
 * @param {number} aspectRatio - キャンバスのアスペクト比（width/height）
 */
function extractFWHR(landmarks, aspectRatio) {
  // 頬骨幅（左右の頬骨間の距離）
  const leftCheek = landmarks[LANDMARKS.LEFT_CHEEKBONE]
  const rightCheek = landmarks[LANDMARKS.RIGHT_CHEEKBONE]

  if (!leftCheek || !rightCheek) {
    console.warn('fWHR: 頬骨ランドマークが見つかりません')
    return 1.9
  }

  const cheekboneWidth = Math.abs(leftCheek.x - rightCheek.x)

  // 顔の高さ（眉の下端から上唇の上端）
  const leftEyebrow = landmarks[LANDMARKS.LEFT_EYEBROW_INNER]
  const rightEyebrow = landmarks[LANDMARKS.RIGHT_EYEBROW_INNER]
  // MOUTH_TOP (13) を使用（UPPER_LIP_TOP=0は顔の上部なので不正確）
  const upperLip = landmarks[LANDMARKS.MOUTH_TOP]

  if (!leftEyebrow || !rightEyebrow || !upperLip) {
    console.warn('fWHR: 眉または唇ランドマークが見つかりません')
    return 1.9
  }

  const eyebrowBottom = Math.min(leftEyebrow.y, rightEyebrow.y)
  const upperLipTop = upperLip.y

  const faceHeight = Math.abs(upperLipTop - eyebrowBottom)

  // fWHR = 幅 / 高さ
  if (faceHeight < 0.01) {
    console.warn('fWHR: 顔の高さが小さすぎます', faceHeight)
    return 1.9
  }

  // アスペクト比補正: x座標はwidth基準、y座標はheight基準なので
  // 実際の比率 = (x_norm * width) / (y_norm * height) = (x_norm / y_norm) * aspectRatio
  const rawRatio = cheekboneWidth / faceHeight
  const fwhr = rawRatio * aspectRatio

  // デバッグ出力（毎回、ただし控えめに）
  if (fwhrHistory.length % 10 === 0) {
    console.log('fWHR:', {
      cheekboneWidth: cheekboneWidth.toFixed(4),
      faceHeight: faceHeight.toFixed(4),
      rawRatio: rawRatio.toFixed(3),
      aspectRatio: aspectRatio.toFixed(3),
      fwhr: fwhr.toFixed(3)
    })
  }

  return fwhr
}

/**
 * 履歴をリセット
 */
export function resetFWHRHistory() {
  fwhrHistory = []
}
