import { useEffect, useRef, useState } from "react";
import "../styles/incomingcall.css";

function IncomingCall({
  callerName,
  callerNumber,
  ringtoneSrc,
  onAccept,
  onDecline,
}) {
  const [seconds, setSeconds] = useState(0);
  const ringtoneRef = useRef(null);

  useEffect(() => {
    const audio = ringtoneRef.current;

    if (audio) {
      audio.loop = true;
      audio.volume = 1;

      audio.play().catch((error) => {
        console.log("Ringtone autoplay blocked:", error);
      });
    }

    // Android vibration
    if (navigator.vibrate) {
      navigator.vibrate([
        500,
        300,
        500,
        300,
        500,
        300,
      ]);
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    };
  }, [ringtoneSrc]);

  // Incoming call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    const min = String(
      Math.floor(seconds / 60)
    ).padStart(2, "0");

    const sec = String(
      seconds % 60
    ).padStart(2, "0");

    return `${min}:${sec}`;
  };

  const stopRingtone = () => {
    const audio = ringtoneRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  const handleAccept = () => {
    stopRingtone();
    onAccept();
  };

  const handleDecline = () => {
    stopRingtone();
    onDecline();
  };

  return (
    <div className="incoming-call">

      <audio
        ref={ringtoneRef}
        src={ringtoneSrc}
        loop
        preload="auto"
      />

      <div className="incoming-top">

        <p className="incoming-text">
          Incoming Call...
        </p>

        <div className="caller-avatar">
          {(callerName || "U")
            .charAt(0)
            .toUpperCase()}
        </div>

        <h1>{callerName}</h1>

        <h3>{callerNumber || "Mobile"}</h3>

        <p className="call-time">
          {formatTime()}
        </p>

      </div>

      <div className="call-buttons">

        <button
          className="decline-btn"
          onClick={handleDecline}
        >
          <div className="call-icon">
            ❌
          </div>

          <span>Decline</span>
        </button>

        <button
          className="accept-btn"
          onClick={handleAccept}
        >
          <div className="call-icon">
            📞
          </div>

          <span>Accept</span>
        </button>

      </div>

    </div>
  );
}

export default IncomingCall;