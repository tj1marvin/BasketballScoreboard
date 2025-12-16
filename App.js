import { useCallback, useEffect, useRef, useState } from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

// --- Constants ---
const INITIAL_GAME_TIME = 12 * 60; // 12 minutes in seconds
const SHOT_CLOCK_INITIAL = 24;
const SHOT_CLOCK_RESET = 14;
const TIMEOUT_INITIAL = 60; // 60 seconds for a timeout

// --- Helper Functions ---

/**
 * Formats the total remaining seconds into MM:SS format.
 */
const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- Scoreboard App Component ---

const Scoreboard = () => {
    // Score State
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    const [teamAName, setTeamAName] = useState('HOME');
    const [teamBName, setTeamBName] = useState('AWAY');

    // Game Timer State
    const [remainingSeconds, setRemainingSeconds] = useState(INITIAL_GAME_TIME);
    const [quarter, setQuarter] = useState(1);
    const [isRunning, setIsRunning] = useState(false);
    const gameIntervalRef = useRef(null);

    // Shot Clock State
    const [shotClockSeconds, setShotClockSeconds] = useState(SHOT_CLOCK_INITIAL);
    const [isShotClockRunning, setIsShotClockRunning] = useState(false);
    const shotClockIntervalRef = useRef(null);

    // Timeout Timer State
    const [timeoutSeconds, setTimeoutSeconds] = useState(TIMEOUT_INITIAL);
    const [isTimeoutRunning, setIsTimeoutRunning] = useState(false);
    const timeoutIntervalRef = useRef(null);

    // Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [tempScoreA, setTempScoreA] = useState(0);
    const [tempScoreB, setTempScoreB] = useState(0);

    // --- Timer Logic ---

    const startPauseTimer = useCallback(() => {
        if (remainingSeconds === 0 && quarter >= 4) return;
        setIsRunning(prev => !prev);
    }, [remainingSeconds, quarter]);

    const resetGameTimer = useCallback(() => {
        setIsRunning(false);
        setRemainingSeconds(INITIAL_GAME_TIME);
    }, []);

    const nextQuarter = useCallback(() => {
        // Stop all timers
        setIsRunning(false);
        setIsShotClockRunning(false);
        setIsTimeoutRunning(false);

        if (quarter >= 4) {
            // Reset entire game
            setScoreA(0);
            setScoreB(0);
            setQuarter(1);
        } else {
            // Move to next quarter
            setQuarter(prev => prev + 1);
        }

        setRemainingSeconds(INITIAL_GAME_TIME);
        setShotClockSeconds(SHOT_CLOCK_INITIAL);
        setTimeoutSeconds(TIMEOUT_INITIAL);
    }, [quarter]);

    // Shot Clock Logic
    const startPauseShotClock = useCallback(() => {
        setIsShotClockRunning(prev => !prev);
    }, []);

    const resetShotClock = useCallback((seconds) => {
        setIsShotClockRunning(false);
        setShotClockSeconds(seconds);
    }, []);

    // Timeout Logic
    const startPauseTimeout = useCallback(() => {
        setIsTimeoutRunning(prev => !prev);
    }, []);

    const resetTimeout = useCallback(() => {
        setIsTimeoutRunning(false);
        setTimeoutSeconds(TIMEOUT_INITIAL);
    }, []);

    // --- Game Timer Effect ---
    useEffect(() => {
        clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = null;

        if (isRunning && remainingSeconds > 0) {
            gameIntervalRef.current = setInterval(() => {
                setRemainingSeconds(prev => prev - 1);
            }, 1000);
        } else if (remainingSeconds === 0) {
            setIsRunning(false);
        }

        return () => clearInterval(gameIntervalRef.current);
    }, [isRunning, remainingSeconds]);

    // --- Shot Clock Effect ---
    useEffect(() => {
        clearInterval(shotClockIntervalRef.current);
        shotClockIntervalRef.current = null;

        if (isShotClockRunning && shotClockSeconds > 0) {
            shotClockIntervalRef.current = setInterval(() => {
                setShotClockSeconds(prev => prev - 1);
            }, 1000);
        } else if (shotClockSeconds === 0) {
            setIsShotClockRunning(false);
        }

        return () => clearInterval(shotClockIntervalRef.current);
    }, [isShotClockRunning, shotClockSeconds]);

    // --- Timeout Timer Effect ---
    useEffect(() => {
        clearInterval(timeoutIntervalRef.current);
        timeoutIntervalRef.current = null;

        if (isTimeoutRunning && timeoutSeconds > 0) {
            timeoutIntervalRef.current = setInterval(() => {
                setTimeoutSeconds(prev => prev - 1);
            }, 1000);
        } else if (timeoutSeconds === 0) {
            setIsTimeoutRunning(false);
            setTimeoutSeconds(TIMEOUT_INITIAL); // Reset when finished
        }

        return () => clearInterval(timeoutIntervalRef.current);
    }, [isTimeoutRunning, timeoutSeconds]);

    // --- Score Management ---

    const updateScore = useCallback((team, points) => {
        if (team === 'A') {
            setScoreA(prev => prev + points);
        } else {
            setScoreB(prev => prev + points);
        }
    }, []);

    const resetScores = useCallback(() => {
        setScoreA(0);
        setScoreB(0);
    }, []);

    // --- Modal Handlers ---

    const openEditModal = () => {
        setTempScoreA(scoreA);
        setTempScoreB(scoreB);
        setIsEditModalVisible(true);
    };

    const applyEditedScores = () => {
        setScoreA(Math.max(0, parseInt(tempScoreA) || 0));
        setScoreB(Math.max(0, parseInt(tempScoreB) || 0));
        setIsEditModalVisible(false);
    };

    // --- Components ---

    const ScoreButton = ({ team, points, colorClass }) => (
        <button
            className={`w-16 h-16 text-3xl font-bold rounded-full shadow-md transition duration-150 border-4 border-current ${colorClass}`}
            onClick={() => updateScore(team, points)}
        >
            +{points}
        </button>
    );

    const TimerButton = ({ title, onClick, bgColorClass, widthClass = 'w-1/3' }) => (
        <button
            className={`px-4 py-2 rounded-lg font-bold shadow-md transition duration-150 ${bgColorClass} ${widthClass} text-sm`}
            onClick={onClick}
        >
            {title}
        </button>
    );

    // --- Render ---
    return (
        <div className="min-h-screen flex flex-col items-center p-4 bg-gray-900">
            <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6">

                {/* --- Timer & Shot Clock Display --- */}
                <div className="flex flex-col items-center bg-gray-700 rounded-xl p-4 shadow-inner">

                    {/* Main Game Info (Timer + Shot Clock) */}
                    <div className="flex justify-center items-end w-full max-w-lg mb-4 gap-8 md:gap-12">
                        <div className="flex flex-col items-center">
                            <div className="text-xl font-semibold text-yellow-400 mb-2">QUARTER {quarter}</div>
                            <div className="font-mono text-6xl md:text-7xl lg:text-8xl font-bold text-red-500">{formatTime(remainingSeconds)}</div>
                        </div>
                        {/* SHOT CLOCK DISPLAY */}
                        <div className="flex flex-col items-center">
                            <div className="text-lg font-semibold text-gray-400 mb-2">SHOT CLOCK</div>
                            <div className={`font-mono text-5xl md:text-6xl font-bold ${shotClockSeconds <= 5 ? 'text-red-500' : 'text-orange-400'}`}>
                                {shotClockSeconds}
                            </div>
                        </div>
                    </div>

                    {/* Main Timer Controls */}
                    <div className="flex flex-wrap justify-center gap-3 mt-3 w-full">
                        <TimerButton
                            title={isRunning ? 'PAUSE' : 'START'}
                            onClick={startPauseTimer}
                            bgColorClass={isRunning ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
                            widthClass="w-auto px-6"
                        />
                        <TimerButton
                            title="RESET TIMER"
                            onClick={resetGameTimer}
                            bgColorClass="bg-red-600 hover:bg-red-700"
                            widthClass="w-auto px-6"
                        />
                        <TimerButton
                            title={quarter >= 4 && remainingSeconds === 0 ? 'END GAME / RESET' : 'NEXT PERIOD'}
                            onClick={nextQuarter}
                            bgColorClass="bg-blue-600 hover:bg-blue-700"
                            widthClass="w-auto px-6"
                        />
                    </div>

                    {/* Shot Clock Controls */}
                    <div className="flex flex-wrap justify-center gap-3 mt-4 border-t border-gray-600 pt-4 w-full">
                        <TimerButton
                            title={isShotClockRunning ? 'SHOT PAUSE' : 'SHOT START'}
                            onClick={startPauseShotClock}
                            bgColorClass={isShotClockRunning ? 'bg-gray-600 hover:bg-gray-700' : 'bg-orange-600 hover:bg-orange-700'}
                            widthClass="w-1/4"
                        />
                        <TimerButton
                            title="RESET 24"
                            onClick={() => resetShotClock(SHOT_CLOCK_INITIAL)}
                            bgColorClass="bg-yellow-500 hover:bg-yellow-600"
                            widthClass="w-1/4"
                        />
                        <TimerButton
                            title="RESET 14"
                            onClick={() => resetShotClock(SHOT_CLOCK_RESET)}
                            bgColorClass="bg-yellow-500 hover:bg-yellow-600"
                            widthClass="w-1/4"
                        />
                    </div>
                </div>

                {/* --- Team Scores --- */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Team A */}
                    <div className="bg-blue-900 rounded-xl p-4 text-center shadow-lg transform hover:scale-[1.01] transition duration-300">
                        <input
                            type="text"
                            value={teamAName}
                            onChange={(e) => setTeamAName(e.target.value)}
                            className="text-3xl font-extrabold text-white bg-transparent w-full text-center mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-1"
                        />
                        <div className="font-mono text-8xl text-blue-300 font-bold">{scoreA}</div>
                        <div className="flex justify-center space-x-3 mt-4">
                            <ScoreButton team="A" points={1} colorClass="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 border-blue-400 text-white" />
                            <ScoreButton team="A" points={2} colorClass="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 border-blue-400 text-white" />
                            <ScoreButton team="A" points={3} colorClass="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 border-blue-400 text-white" />
                        </div>
                    </div>

                    {/* Team B */}
                    <div className="bg-red-900 rounded-xl p-4 text-center shadow-lg transform hover:scale-[1.01] transition duration-300">
                        <input
                            type="text"
                            value={teamBName}
                            onChange={(e) => setTeamBName(e.target.value)}
                            className="text-3xl font-extrabold text-white bg-transparent w-full text-center mb-4 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-md p-1"
                        />
                        <div className="font-mono text-8xl text-red-300 font-bold">{scoreB}</div>
                        <div className="flex justify-center space-x-3 mt-4">
                            <ScoreButton team="B" points={1} colorClass="bg-red-600 hover:bg-red-700 active:bg-red-800 border-red-400 text-white" />
                            <ScoreButton team="B" points={2} colorClass="bg-red-600 hover:bg-red-700 active:bg-red-800 border-red-400 text-white" />
                            <ScoreButton team="B" points={3} colorClass="bg-red-600 hover:bg-red-700 active:bg-red-800 border-red-400 text-white" />
                        </div>
                    </div>
                </div>

                {/* Score Management Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                    <TimerButton
                        title="EDIT SCORES"
                        onClick={openEditModal}
                        bgColorClass="bg-indigo-500 hover:bg-indigo-600"
                        widthClass="w-auto px-8 py-3"
                    />
                    <TimerButton
                        title="RESET SCORES (0-0)"
                        onClick={resetScores}
                        bgColorClass="bg-gray-500 hover:bg-gray-600"
                        widthClass="w-auto px-8 py-3"
                    />
                </div>

                {/* --- Timeout Timer Panel --- */}
                <div className="flex flex-col items-center bg-gray-700 rounded-xl p-4 shadow-inner mt-6">
                    <div className="text-2xl font-bold text-teal-400 mb-3">TIMEOUT / BREAK TIMER</div>
                    <div className="font-mono text-5xl text-teal-300 font-bold">{formatTime(timeoutSeconds)}</div>
                    <div className="flex flex-wrap justify-center gap-3 mt-3 w-full">
                        <TimerButton
                            title={isTimeoutRunning ? 'PAUSE' : 'START'}
                            onClick={startPauseTimeout}
                            bgColorClass={isTimeoutRunning ? 'bg-gray-600 hover:bg-gray-700' : 'bg-teal-600 hover:bg-teal-700'}
                            widthClass="w-2/5"
                        />
                        <TimerButton
                            title="RESET 60s"
                            onClick={resetTimeout}
                            bgColorClass="bg-teal-600 hover:bg-teal-700"
                            widthClass="w-2/5"
                        />
                    </div>
                </div>
            </div>

            {/* --- Edit Score Modal (Adapted to Tailwind/React) --- */}
            <div
                className={`fixed inset-0 items-center justify-center transition-opacity duration-300 ${isEditModalVisible ? 'flex bg-black bg-opacity-70' : 'hidden'}`}
            >
                <div className="bg-gray-800 rounded-xl p-8 w-11/12 max-w-md shadow-2xl border-t-4 border-indigo-500 text-white">
                    <h2 className="text-2xl font-bold mb-6 text-indigo-400">Edit Scores Manually</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-300">{teamAName} Score</label>
                            <input
                                type="number"
                                min="0"
                                value={tempScoreA}
                                onChange={(e) => setTempScoreA(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-red-300">{teamBName} Score</label>
                            <input
                                type="number"
                                min="0"
                                value={tempScoreB}
                                onChange={(e) => setTempScoreB(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 mt-8">
                        <button
                            onClick={() => setIsEditModalVisible(false)}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg font-semibold transition duration-150"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={applyEditedScores}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition duration-150"
                        >
                            Apply Scores
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scoreboard;