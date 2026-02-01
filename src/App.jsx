import { useState, useCallback } from 'react'
import StartScreen from './components/StartScreen'
import CalibrationScreen from './components/CalibrationScreen'
import RotationScreen from './components/RotationScreen'
import ResultScreen from './components/ResultScreen'
import './App.css'

// フェーズ定義
const PHASES = {
  START: 'start',
  CALIBRATION: 'calibration',
  RIGHT_ROTATION: 'right',
  LEFT_ROTATION: 'left',
  UP_ROTATION: 'up',
  RESULT: 'result'
}

function App() {
  const [phase, setPhase] = useState(PHASES.START)
  const [calibrationData, setCalibrationData] = useState(null)
  const [measurementData, setMeasurementData] = useState({
    right: null,
    left: null,
    up: null
  })
  const [faceCombatData, setFaceCombatData] = useState(null)
  const [jujutsuData, setJujutsuData] = useState(null)
  const [trapeziusData, setTrapeziusData] = useState(null)
  // フェーズ遷移
  const handleStart = useCallback(() => {
    setPhase(PHASES.CALIBRATION)
  }, [])

  const handleCalibrationComplete = useCallback((data) => {
    setCalibrationData(data)
    setPhase(PHASES.RIGHT_ROTATION)
  }, [])

  const handleRotationComplete = useCallback((direction, data, faceCombat, jujutsu, trapezius) => {
    setMeasurementData(prev => ({
      ...prev,
      [direction]: data
    }))

    // 闘争的フェイス特徴データを更新（最後の計測結果を使用）
    if (faceCombat) {
      setFaceCombatData(faceCombat)
    }

    // 柔術フェイス特徴データを更新
    if (jujutsu) {
      setJujutsuData(jujutsu)
    }

    // 首肩ボリューム特徴データを更新
    if (trapezius) {
      setTrapeziusData(trapezius)
    }

    // 次のフェーズへ
    if (direction === 'right') {
      setPhase(PHASES.LEFT_ROTATION)
    } else if (direction === 'left') {
      setPhase(PHASES.UP_ROTATION)
    } else if (direction === 'up') {
      setPhase(PHASES.RESULT)
    }
  }, [])

  return (
    <div className="app">
      {/* スキャンラインエフェクト */}
      <div className="scanline-overlay" />

      {/* 横向き警告（モバイルのみ） */}
      <div className="landscape-warning">
        <div className="landscape-warning-icon">📱</div>
        <p className="landscape-warning-text">縦向きにしてください</p>
      </div>

      {phase === PHASES.START && (
        <StartScreen onStart={handleStart} />
      )}

      {phase === PHASES.CALIBRATION && (
        <CalibrationScreen onComplete={handleCalibrationComplete} />
      )}

      {(phase === PHASES.RIGHT_ROTATION ||
        phase === PHASES.LEFT_ROTATION ||
        phase === PHASES.UP_ROTATION) && (
        <RotationScreen
          key={phase}
          direction={phase}
          calibrationData={calibrationData}
          onComplete={(data, faceCombat, jujutsu, trapezius) => handleRotationComplete(phase, data, faceCombat, jujutsu, trapezius)}
        />
      )}

      {phase === PHASES.RESULT && (
        <ResultScreen
          calibrationData={calibrationData}
          measurementData={measurementData}
          faceCombatData={faceCombatData}
          jujutsuData={jujutsuData}
          trapeziusData={trapeziusData}
        />
      )}
    </div>
  )
}

export default App
