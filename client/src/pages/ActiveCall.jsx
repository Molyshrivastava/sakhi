import { useEffect, useRef, useState } from "react";
import {
  FaPhoneSlash,
  FaVolumeUp,
  FaVolumeMute,
  FaMicrophoneSlash,
  FaTh,
} from "react-icons/fa";
import "../styles/activecall.css";

function ActiveCall({
  callerName,
  onEndCall,
  audioSrc,
}) {
  const [seconds, setSeconds] = useState(0);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [muted, setMuted] = useState(false);

  const audioRef = useRef(null);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Conversation audio
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.loop = true;
    audio.volume = 1;
    audio.muted = false;

    const playAudio = async () => {
      try {
        await audio.play();
        console.log(
          "Conversation audio started:",
          audioSrc
        );
      } catch (error) {
        console.error(
          "Conversation audio failed:",
          error
        );
      }
    };

    playAudio();

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audioSrc]);

  const formatTime = () => {
    const min = String(
      Math.floor(seconds / 60)
    ).padStart(2, "0");

    const sec = String(
      seconds % 60
    ).padStart(2, "0");

    return `${min}:${sec}`;
  };

  const toggleSpeaker = () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (speakerOn) {
      audio.volume = 0.5;
    } else {
      audio.volume = 1;
    }

    setSpeakerOn(!speakerOn);
  };

  const toggleMute = () => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.muted = !muted;
    setMuted(!muted);
  };

  const endCall = () => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    onEndCall();
  };

  return (
    <div className="active-call">

      <audio
        ref={audioRef}
        src={audioSrc}
        loop
        preload="auto"
      />

      <h1>{callerName}</h1>

      <h2>{formatTime()}</h2>

      <p>Connected</p>

      <div className="call-options">

        <button onClick={toggleSpeaker}>
          {speakerOn ? (
            <FaVolumeUp />
          ) : (
            <FaVolumeMute />
          )}

          <span>Speaker</span>
        </button>

        <button onClick={toggleMute}>
          <FaMicrophoneSlash />

          <span>
            {muted ? "Unmute" : "Mute"}
          </span>
        </button>

        <button>
          <FaTh />

          <span>Keypad</span>
        </button>

      </div>

      <button
        className="end-call-btn"
        onClick={endCall}
      >
        <FaPhoneSlash />
      </button>

    </div>
  );
}

export default ActiveCall;