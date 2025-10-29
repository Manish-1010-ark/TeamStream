// frontend/src/hooks/useUserMedia.js
import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to manage local media stream (camera and microphone)
 * Handles getUserMedia, track toggles, and cleanup
 * 
 * @returns {Object} Media state and control functions
 */
function useUserMedia() {
  const [localStream, setLocalStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use ref to maintain stream across renders
  const streamRef = useRef(null);

  /**
   * Request user media (camera and microphone)
   */
  const startMedia = useCallback(async () => {
    console.log('🎥 Requesting user media...');
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('✅ Got user media');
      console.log(`📹 Video tracks: ${stream.getVideoTracks().length}`);
      console.log(`🔊 Audio tracks: ${stream.getAudioTracks().length}`);

      // Log track details
      stream.getTracks().forEach((track) => {
        console.log(`  - ${track.kind}: ${track.label} (enabled: ${track.enabled})`);
      });

      streamRef.current = stream;
      setLocalStream(stream);
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
      setIsLoading(false);

      return stream;
    } catch (err) {
      console.error('❌ Error accessing media devices:', err);
      
      let errorMessage = 'Failed to access camera/microphone.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permission denied. Please allow access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera/microphone does not meet the required constraints.';
      }

      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Stop all media tracks and clean up
   */
  const stopMedia = useCallback(() => {
    console.log('🛑 Stopping user media...');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`  - Stopped ${track.kind} track: ${track.label}`);
      });

      streamRef.current = null;
      setLocalStream(null);
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
      console.log('✅ User media stopped');
    }
  }, []);

  /**
   * Toggle audio track on/off
   */
  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log(`🔊 Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }, []);

  /**
   * Toggle video track on/off
   */
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log(`📹 Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }, []);

  /**
   * Replace the current stream (for device switching - future enhancement)
   */
  const replaceStream = useCallback((newStream) => {
    console.log('🔄 Replacing media stream...');

    // Stop old stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Set new stream
    streamRef.current = newStream;
    setLocalStream(newStream);

    // Update track states
    const audioTrack = newStream.getAudioTracks()[0];
    const videoTrack = newStream.getVideoTracks()[0];
    setIsAudioEnabled(audioTrack ? audioTrack.enabled : false);
    setIsVideoEnabled(videoTrack ? videoTrack.enabled : false);

    console.log('✅ Media stream replaced');
  }, []);

  return {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    isLoading,
    startMedia,
    stopMedia,
    toggleAudio,
    toggleVideo,
    replaceStream,
  };
}

export default useUserMedia;