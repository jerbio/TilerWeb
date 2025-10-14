import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Mic, MicOff, Play, Pause, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';

const MicrophoneButton = styled.button<{ $isRecording: boolean }>`
	position: absolute;
	bottom: 1rem;
	right: 1rem;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: none;
	background: ${({ $isRecording }) =>
		$isRecording
			? `linear-gradient(135deg, ${palette.colors.brand[500]}, ${palette.colors.brand[600]})`
			: palette.colors.gray[800]};
	color: ${({ $isRecording }) => ($isRecording ? palette.colors.white : palette.colors.gray[400])};
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	box-shadow: ${({ $isRecording }) =>
		$isRecording ? `0 0 0 0 ${palette.colors.brand[500]}` : 'none'};
	animation: ${({ $isRecording }) => ($isRecording ? 'pulse 1.5s infinite' : 'none')};
	z-index: 1;

	&:hover {
		background: ${({ $isRecording }) =>
			$isRecording
				? `linear-gradient(135deg, ${palette.colors.brand[600]}, ${palette.colors.brand[700]})`
				: palette.colors.gray[700]};
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 ${palette.colors.brand[500]}80;
		}
		50% {
			box-shadow: 0 0 0 10px ${palette.colors.brand[500]}00;
		}
		100% {
			box-shadow: 0 0 0 0 ${palette.colors.brand[500]}00;
		}
	}
`;

const AudioPlaybackContainer = styled.div<{ $visible: boolean }>`
	position: absolute;
	bottom: 4rem;
	right: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: ${palette.colors.gray[800]};
	padding: 0.5rem 0.75rem;
	border-radius: ${palette.borderRadius.large};
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	transform: ${({ $visible }) => ($visible ? 'translateY(0)' : 'translateY(10px)')};
	transition: all 0.3s ease;
	pointer-events: ${({ $visible }) => ($visible ? 'all' : 'none')};
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
	z-index: 2;
`;

const PlaybackButton = styled.button<{ $isPlaying?: boolean }>`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border: none;
	background: ${({ $isPlaying }) =>
		$isPlaying
			? `linear-gradient(135deg, ${palette.colors.brand[500]}, ${palette.colors.brand[600]})`
			: palette.colors.gray[700]};
	color: ${palette.colors.white};
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $isPlaying }) =>
			$isPlaying
				? `linear-gradient(135deg, ${palette.colors.brand[600]}, ${palette.colors.brand[700]})`
				: palette.colors.gray[600]};
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}
`;

const AudioWaveform = styled.div`
	display: flex;
	align-items: center;
	gap: 2px;
	height: 24px;
`;

const WaveBar = styled.div<{ $height: number; $isPlaying: boolean }>`
	width: 3px;
	height: ${({ $height }) => $height}px;
	background: ${({ $isPlaying }) =>
		$isPlaying ? palette.colors.brand[500] : palette.colors.gray[600]};
	border-radius: 2px;
	transition: all 0.2s ease;
`;

const AudioDuration = styled.span`
	font-size: ${palette.typography.fontSize.xs};
	color: ${palette.colors.gray[300]};
	font-family: ${palette.typography.fontFamily.inter};
	min-width: 35px;
	text-align: center;
`;

const DeleteButton = styled.button`
	width: 24px;
	height: 24px;
	border-radius: 50%;
	border: none;
	background: transparent;
	color: ${palette.colors.gray[400]};
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&:hover {
		background: ${palette.colors.gray[700]};
		color: ${palette.colors.error};
	}

	&:active {
		transform: scale(0.9);
	}
`;

const RecordingIndicator = styled.div<{ $isRecording: boolean }>`
	position: absolute;
	top: -0.5rem;
	left: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: ${palette.colors.gray[800]};
	padding: 0.25rem 0.75rem;
	border-radius: ${palette.borderRadius.large};
	opacity: ${({ $isRecording }) => ($isRecording ? 1 : 0)};
	transform: ${({ $isRecording }) => ($isRecording ? 'translateY(0)' : 'translateY(10px)')};
	transition: all 0.3s ease;
	pointer-events: none;

	&::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: ${palette.colors.brand[500]};
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%,
		50% {
			opacity: 1;
		}
		51%,
		100% {
			opacity: 0;
		}
	}

	span {
		font-size: ${palette.typography.fontSize.xs};
		color: ${palette.colors.gray[300]};
		font-family: ${palette.typography.fontFamily.inter};
		font-weight: ${palette.typography.fontWeight.medium};
	}
`;

export interface VoiceInputProps {
	/** Callback when recording starts */
	onRecordingStart?: () => void;
	/** Callback when recording stops */
	onRecordingStop?: () => void;
	/** Callback when audio recording is complete - receives audio blob */
	onAudioRecorded?: (audioBlob: Blob) => void;
	/** Callback when error occurs */
	onError?: (error: string) => void;
	/** Whether to show the recording indicator (default: true) */
	showIndicator?: boolean;
	/** Custom indicator text (default: uses i18n 'common.voiceInput.listening') */
	indicatorText?: string;
	/** Whether recording is disabled */
	disabled?: boolean;
	/** Custom button size in pixels (default: 40) */
	buttonSize?: number;
	/** Custom button position */
	buttonPosition?: {
		bottom?: string;
		right?: string;
		top?: string;
		left?: string;
	};
	/** Custom aria label for start recording button (default: uses i18n) */
	ariaLabelStart?: string;
	/** Custom aria label for stop recording button (default: uses i18n) */
	ariaLabelStop?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
	onRecordingStart,
	onRecordingStop,
	onAudioRecorded,
	onError,
	showIndicator = true,
	indicatorText,
	disabled = false,
	buttonSize = 40,
	buttonPosition = { bottom: '1rem', right: '1rem' },
	ariaLabelStart,
	ariaLabelStop,
}) => {
	const { t } = useTranslation();
	const [isRecording, setIsRecording] = useState(false);
	const [audioURL, setAudioURL] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Use i18n translations with fallback to custom props
	const listeningText = indicatorText || t('common.voiceInput.listening');
	const startRecordingLabel = ariaLabelStart || t('common.voiceInput.startRecording');
	const stopRecordingLabel = ariaLabelStop || t('common.voiceInput.stopRecording');
	const playLabel = t('common.voiceInput.playRecording');
	const pauseLabel = t('common.voiceInput.pauseRecording');
	const deleteLabel = t('common.voiceInput.deleteRecording');

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
				mediaRecorderRef.current.stop();
			}
			if (mediaStreamRef.current) {
				mediaStreamRef.current.getTracks().forEach(track => track.stop());
			}
		};
	}, []);

	const toggleRecording = async () => {
		if (disabled) return;

		if (isRecording) {
			// Stop recording
			if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
				try {
					mediaRecorderRef.current.stop();
				} catch (error) {
					console.error('Error stopping media recorder:', error);
				}
			}
			// Stop media stream tracks
			if (mediaStreamRef.current) {
				mediaStreamRef.current.getTracks().forEach(track => track.stop());
				mediaStreamRef.current = null;
			}
			setIsRecording(false);
		} else {
			// Start recording
			try {
				// Start audio recording
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				mediaStreamRef.current = stream; // Store stream reference
				audioChunksRef.current = []; // Reset chunks
				
				mediaRecorderRef.current = new MediaRecorder(stream);
				
				mediaRecorderRef.current.ondataavailable = (event) => {
					if (event.data.size > 0) {
						audioChunksRef.current.push(event.data);
					}
				};
				
				mediaRecorderRef.current.onstop = () => {
					// Create audio blob from chunks
					const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
					
					// Create URL for playback
					const url = URL.createObjectURL(audioBlob);
					setAudioURL(url);
					
					if (onAudioRecorded) {
						onAudioRecorded(audioBlob);
					}
					
					// Stop all tracks to release microphone
					if (mediaStreamRef.current) {
						mediaStreamRef.current.getTracks().forEach(track => track.stop());
						mediaStreamRef.current = null;
					}
					
					if (onRecordingStop) {
						onRecordingStop();
					}
				};
				
				mediaRecorderRef.current.onerror = (event) => {
					console.error('MediaRecorder error:', event);
					if (onError) {
						onError('Audio recording failed');
					}
					setIsRecording(false);
				};
				
				mediaRecorderRef.current.start();
				
				setIsRecording(true);
				if (onRecordingStart) {
					onRecordingStart();
				}
			} catch (error) {
				console.error('Error accessing microphone:', error);
				if (onError) {
					onError('Failed to access microphone');
				}
			}
		}
	};

	const togglePlayback = () => {
		if (!audioRef.current || !audioURL) return;

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			audioRef.current.play();
			setIsPlaying(true);
		}
	};

	const deleteRecording = () => {
		if (audioURL) {
			URL.revokeObjectURL(audioURL);
		}
		setAudioURL(null);
		setIsPlaying(false);
		setCurrentTime(0);
		setDuration(0);
		audioChunksRef.current = [];
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	// Setup audio element event listeners
	useEffect(() => {
		if (!audioRef.current) return;

		const audio = audioRef.current;

		const handleTimeUpdate = () => {
			setCurrentTime(audio.currentTime);
		};

		const handleLoadedMetadata = () => {
			setDuration(audio.duration);
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};

		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		audio.addEventListener('ended', handleEnded);

		return () => {
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
			audio.removeEventListener('ended', handleEnded);
		};
	}, [audioURL]);

	// Cleanup audio URL on unmount
	useEffect(() => {
		return () => {
			if (audioURL) {
				URL.revokeObjectURL(audioURL);
			}
		};
	}, [audioURL]);

	return (
		<>
			{showIndicator && (
				<RecordingIndicator $isRecording={isRecording}>
					<span>{listeningText}</span>
				</RecordingIndicator>
			)}
			
			{/* Audio Playback Controls */}
			{audioURL && (
				<>
					<audio ref={audioRef} src={audioURL} style={{ display: 'none' }} />
					<AudioPlaybackContainer $visible={!isRecording}>
						<PlaybackButton onClick={togglePlayback} $isPlaying={isPlaying} title={isPlaying ? pauseLabel : playLabel}>
							{isPlaying ? <Pause size={16} /> : <Play size={16} />}
						</PlaybackButton>
						
						<AudioWaveform>
							{[12, 18, 24, 18, 22, 16, 20, 14].map((height, i) => (
								<WaveBar key={i} $height={height} $isPlaying={isPlaying} />
							))}
						</AudioWaveform>
						
						<AudioDuration>
							{formatTime(currentTime)} / {formatTime(duration)}
						</AudioDuration>
						
						<DeleteButton onClick={deleteRecording} title={deleteLabel}>
							<X size={14} />
						</DeleteButton>
					</AudioPlaybackContainer>
				</>
			)}
			
			<MicrophoneButton
				type="button"
				$isRecording={isRecording}
				onClick={toggleRecording}
				disabled={disabled || isPlaying}
				title={isRecording ? stopRecordingLabel : startRecordingLabel}
				aria-label={isRecording ? stopRecordingLabel : startRecordingLabel}
				style={{
					width: `${buttonSize}px`,
					height: `${buttonSize}px`,
					bottom: buttonPosition.bottom,
					right: buttonPosition.right,
					top: buttonPosition.top,
					left: buttonPosition.left,
				}}
			>
				{isRecording ? <MicOff size={buttonSize * 0.5} /> : <Mic size={buttonSize * 0.5} />}
			</MicrophoneButton>
		</>
	);
};

export default VoiceInput;
