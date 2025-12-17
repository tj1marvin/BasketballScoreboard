import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';

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
        <TouchableOpacity
            style={[styles.scoreButton, { backgroundColor: colorClass }]}
            onPress={() => updateScore(team, points)}
        >
            <Text style={styles.scoreButtonText}>+{points}</Text>
        </TouchableOpacity>
    );

    const TimerButton = ({ title, onClick, bgColorClass, widthClass = 'w-1/3' }) => (
        <TouchableOpacity
            style={[
                styles.timerButton,
                { backgroundColor: bgColorClass },
                widthClass === 'w-1/3' ? styles.timerButtonThird : styles.timerButtonAuto
            ]}
            onPress={onClick}
        >
            <Text style={styles.timerButtonText}>{title}</Text>
        </TouchableOpacity>
    );

    // --- Render ---
    return (
        <View style={styles.container}>
            <View style={styles.mainCard}>

                {/* --- Timer & Shot Clock Display --- */}
                <View style={styles.timerSection}>

                    {/* Main Game Info (Timer + Shot Clock) */}
                    <View style={styles.gameInfo}>
                        <View style={styles.quarterContainer}>
                            <Text style={styles.quarterText}>QUARTER {quarter}</Text>
                            <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
                        </View>
                        {/* SHOT CLOCK DISPLAY */}
                        <View style={styles.shotClockContainer}>
                            <Text style={styles.shotClockLabel}>SHOT CLOCK</Text>
                            <Text style={[styles.shotClockText, shotClockSeconds <= 5 ? styles.shotClockRed : styles.shotClockOrange]}>
                                {shotClockSeconds}
                            </Text>
                        </View>
                    </View>

                    {/* Main Timer Controls */}
                    <View style={styles.timerControls}>
                        <TimerButton
                            title={isRunning ? 'PAUSE' : 'START'}
                            onClick={startPauseTimer}
                            bgColorClass={isRunning ? '#ea580c' : '#16a34a'}
                        />
                        <TimerButton
                            title="RESET TIMER"
                            onClick={resetGameTimer}
                            bgColorClass="#dc2626"
                        />
                        <TimerButton
                            title={quarter >= 4 && remainingSeconds === 0 ? 'END GAME / RESET' : 'NEXT PERIOD'}
                            onClick={nextQuarter}
                            bgColorClass="#2563eb"
                        />
                    </View>

                    {/* Shot Clock Controls */}
                    <View style={styles.shotClockControls}>
                        <TimerButton
                            title={isShotClockRunning ? 'SHOT PAUSE' : 'SHOT START'}
                            onClick={startPauseShotClock}
                            bgColorClass={isShotClockRunning ? '#4b5563' : '#ea580c'}
                        />
                        <TimerButton
                            title="RESET 24"
                            onClick={() => resetShotClock(SHOT_CLOCK_INITIAL)}
                            bgColorClass="#eab308"
                        />
                        <TimerButton
                            title="RESET 14"
                            onClick={() => resetShotClock(SHOT_CLOCK_RESET)}
                            bgColorClass="#eab308"
                        />
                    </View>
                </View>

                {/* --- Team Scores --- */}
                <View style={styles.teamScores}>
                    {/* Team A */}
                    <View style={styles.teamCardA}>
                        <TextInput
                            value={teamAName}
                            onChangeText={setTeamAName}
                            style={styles.teamNameInput}
                        />
                        <Text style={styles.scoreText}>{scoreA}</Text>
                        <View style={styles.scoreButtons}>
                            <ScoreButton team="A" points={1} colorClass="#2563eb" />
                            <ScoreButton team="A" points={2} colorClass="#2563eb" />
                            <ScoreButton team="A" points={3} colorClass="#2563eb" />
                        </View>
                    </View>

                    {/* Team B */}
                    <View style={styles.teamCardB}>
                        <TextInput
                            value={teamBName}
                            onChangeText={setTeamBName}
                            style={styles.teamNameInput}
                        />
                        <Text style={styles.scoreText}>{scoreB}</Text>
                        <View style={styles.scoreButtons}>
                            <ScoreButton team="B" points={1} colorClass="#dc2626" />
                            <ScoreButton team="B" points={2} colorClass="#dc2626" />
                            <ScoreButton team="B" points={3} colorClass="#dc2626" />
                        </View>
                    </View>
                </View>

                {/* Score Management Buttons */}
                <View style={styles.managementButtons}>
                    <TimerButton
                        title="EDIT SCORES"
                        onClick={openEditModal}
                        bgColorClass="#6366f1"
                    />
                    <TimerButton
                        title="RESET SCORES (0-0)"
                        onClick={resetScores}
                        bgColorClass="#6b7280"
                    />
                </View>

                {/* --- Timeout Timer Panel --- */}
                <View style={styles.timeoutPanel}>
                    <Text style={styles.timeoutTitle}>TIMEOUT / BREAK TIMER</Text>
                    <Text style={styles.timeoutText}>{formatTime(timeoutSeconds)}</Text>
                    <View style={styles.timeoutControls}>
                        <TimerButton
                            title={isTimeoutRunning ? 'PAUSE' : 'START'}
                            onClick={startPauseTimeout}
                            bgColorClass={isTimeoutRunning ? '#4b5563' : '#0d9488'}
                        />
                        <TimerButton
                            title="RESET 60s"
                            onClick={resetTimeout}
                            bgColorClass="#0d9488"
                        />
                    </View>
                </View>
            </View>

            {/* --- Edit Score Modal --- */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Scores Manually</Text>

                        <View style={styles.modalInputs}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{teamAName} Score</Text>
                                <TextInput
                                    keyboardType="numeric"
                                    value={tempScoreA.toString()}
                                    onChangeText={(text) => setTempScoreA(text)}
                                    style={styles.textInput}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{teamBName} Score</Text>
                                <TextInput
                                    keyboardType="numeric"
                                    value={tempScoreB.toString()}
                                    onChangeText={(text) => setTempScoreB(text)}
                                    style={styles.textInput}
                                />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsEditModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.applyButton]}
                                onPress={applyEditedScores}
                            >
                                <Text style={styles.modalButtonText}>Apply Scores</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainCard: {
        width: '100%',
        maxWidth: 800,
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    timerSection: {
        backgroundColor: '#374151',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    gameInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 16,
    },
    quarterContainer: {
        alignItems: 'center',
    },
    quarterText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fbbf24',
        marginBottom: 8,
    },
    timerText: {
        fontFamily: 'monospace',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    shotClockContainer: {
        alignItems: 'center',
    },
    shotClockLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 8,
    },
    shotClockText: {
        fontFamily: 'monospace',
        fontSize: 40,
        fontWeight: 'bold',
    },
    shotClockOrange: {
        color: '#fb923c',
    },
    shotClockRed: {
        color: '#ef4444',
    },
    timerControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
        width: '100%',
    },
    shotClockControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#4b5563',
        width: '100%',
    },
    teamScores: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    teamCardA: {
        flex: 1,
        backgroundColor: '#1e3a8a',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    teamCardB: {
        flex: 1,
        backgroundColor: '#991b1b',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    teamNameInput: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        backgroundColor: 'transparent',
        textAlign: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 8,
        padding: 8,
        width: '100%',
    },
    scoreText: {
        fontFamily: 'monospace',
        fontSize: 64,
        fontWeight: 'bold',
        color: '#93c5fd',
        marginBottom: 16,
    },
    scoreButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    scoreButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 4,
        borderColor: '#ffffff',
    },
    scoreButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    managementButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 16,
    },
    timeoutPanel: {
        backgroundColor: '#374151',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    timeoutTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#14b8a6',
        marginBottom: 12,
    },
    timeoutText: {
        fontFamily: 'monospace',
        fontSize: 40,
        fontWeight: 'bold',
        color: '#5eead4',
    },
    timeoutControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 12,
        width: '100%',
    },
    timerButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    timerButtonThird: {
        flex: 1,
    },
    timerButtonAuto: {
        minWidth: 120,
    },
    timerButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderTopWidth: 4,
        borderTopColor: '#6366f1',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#a78bfa',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalInputs: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#93c5fd',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#374151',
        borderWidth: 1,
        borderColor: '#4b5563',
        borderRadius: 8,
        padding: 12,
        color: '#ffffff',
        fontSize: 18,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6b7280',
    },
    applyButton: {
        backgroundColor: '#4f46e5',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});

export default Scoreboard;