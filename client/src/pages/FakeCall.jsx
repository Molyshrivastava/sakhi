import { useEffect, useState } from "react";

import {
  FaPhoneAlt,
  FaUpload,
  FaTrash,
} from "react-icons/fa";

import IncomingCall from "./IncomingCall";
import ActiveCall from "./ActiveCall";

import "../styles/fakecall.css";

import toast from "react-hot-toast";

import {
  saveAudio,
  getAudio,
  deleteAudio,
} from "../utils/audioDB";


function FakeCall() {

  // =====================================================
  // CALL STATE
  // =====================================================

  const [incomingCall, setIncomingCall] = useState(false);

  const [callAccepted, setCallAccepted] =
    useState(false);


  // =====================================================
  // CALLER
  // =====================================================

  const [caller, setCaller] =
    useState("Mom");

  const [customCaller, setCustomCaller] =
    useState("");

  const [customNumber, setCustomNumber] =
    useState("");


  // =====================================================
  // CALL DELAY
  // =====================================================

  const [delay, setDelay] =
    useState(3);


  // =====================================================
  // RINGTONE
  // =====================================================

  const [ringtoneAudio, setRingtoneAudio] =
    useState("");

  const [ringtoneName, setRingtoneName] =
    useState("");


  // =====================================================
  // CONVERSATION
  // =====================================================

  const [conversationAudio, setConversationAudio] =
    useState("");

  const [conversationName, setConversationName] =
    useState("");

  const [audioType, setAudioType] =
    useState("default");


  // =====================================================
  // LOAD SAVED AUDIO WHEN PAGE OPENS
  // =====================================================

  useEffect(() => {

    const loadSavedAudio = async () => {

      try {

        // -----------------------------
        // LOAD RINGTONE
        // -----------------------------

        const savedRingtone =
          await getAudio("ringtone");

        if (savedRingtone) {

          const url =
            URL.createObjectURL(savedRingtone);

          setRingtoneAudio(url);

          setRingtoneName(
            savedRingtone.name ||
            "Saved Ringtone"
          );
        }


        // -----------------------------
        // LOAD CONVERSATION
        // -----------------------------

        const savedConversation =
          await getAudio("conversation");

        if (savedConversation) {

          const url =
            URL.createObjectURL(
              savedConversation
            );

          setConversationAudio(url);

          setConversationName(
            savedConversation.name ||
            "Saved Conversation"
          );

          setAudioType("custom");
        }

      } catch (error) {

        console.error(
          "Error loading saved audio:",
          error
        );

      }

    };

    loadSavedAudio();

  }, []);


  // =====================================================
  // UPLOAD RINGTONE
  // =====================================================

  const handleRingtoneUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    try {

      // Save actual file in IndexedDB
      await saveAudio(
        "ringtone",
        file
      );

      // Create temporary URL for playback
      const url =
        URL.createObjectURL(file);

      setRingtoneAudio(url);

      setRingtoneName(file.name);

      toast.success(
        "Ringtone saved successfully"
      );

    } catch (error) {

      console.error(error);

      toast.error(
        "Could not save ringtone"
      );

    }

    // Allow selecting the same file again
    e.target.value = "";

  };


  // =====================================================
  // UPLOAD CONVERSATION AUDIO
  // =====================================================

  const handleConversationUpload =
    async (e) => {

      const file = e.target.files[0];

      if (!file) return;

      try {

        // Save actual file
        await saveAudio(
          "conversation",
          file
        );

        // Create playback URL
        const url =
          URL.createObjectURL(file);

        setConversationAudio(url);

        setConversationName(file.name);

        setAudioType("custom");

        toast.success(
          "Conversation audio saved successfully"
        );

      } catch (error) {

        console.error(error);

        toast.error(
          "Could not save conversation audio"
        );

      }

      e.target.value = "";

    };


  // =====================================================
  // DELETE RINGTONE
  // =====================================================

  const handleDeleteRingtone =
    async () => {

      try {

        await deleteAudio("ringtone");

        if (ringtoneAudio) {
          URL.revokeObjectURL(
            ringtoneAudio
          );
        }

        setRingtoneAudio("");

        setRingtoneName("");

        toast.success(
          "Ringtone deleted"
        );

      } catch (error) {

        console.error(error);

        toast.error(
          "Could not delete ringtone"
        );

      }

    };


  // =====================================================
  // DELETE CONVERSATION
  // =====================================================

  const handleDeleteConversation =
    async () => {

      try {

        await deleteAudio(
          "conversation"
        );

        if (conversationAudio) {
          URL.revokeObjectURL(
            conversationAudio
          );
        }

        setConversationAudio("");

        setConversationName("");

        setAudioType("default");

        toast.success(
          "Conversation audio deleted"
        );

      } catch (error) {

        console.error(error);

        toast.error(
          "Could not delete conversation audio"
        );

      }

    };


  // =====================================================
  // START FAKE CALL
  // =====================================================

  const startFakeCall = () => {

    if (
      caller === "Custom" &&
      !customCaller.trim()
    ) {

      toast.error(
        "Please enter caller name"
      );

      return;
    }


    toast.success(
      `Fake call will arrive in ${delay} seconds`
    );


    setTimeout(() => {

      setIncomingCall(true);

    }, delay * 1000);

  };


  // =====================================================
  // INCOMING CALL SCREEN
  // =====================================================

  if (
    incomingCall &&
    !callAccepted
  ) {

    return (
      <IncomingCall

        callerName={
          caller === "Custom"
            ? customCaller
            : caller
        }

        callerNumber={
          caller === "Custom"
            ? customNumber
            : ""
        }

        ringtoneSrc={
          ringtoneAudio ||
          "/audio/default-ringtone.mp3"
        }

        onAccept={() => {

          setCallAccepted(true);

        }}

        onDecline={() => {

          setIncomingCall(false);

          setCallAccepted(false);

        }}

      />
    );

  }


  // =====================================================
  // ACTIVE CALL SCREEN
  // =====================================================

  if (callAccepted) {

    return (
      <ActiveCall

        callerName={
          caller === "Custom"
            ? customCaller
            : caller
        }

        audioSrc={
          audioType === "custom" &&
          conversationAudio

            ? conversationAudio

            : "/audio/default-conversation.mp3"
        }

        onEndCall={() => {

          setIncomingCall(false);

          setCallAccepted(false);

        }}

      />
    );

  }


  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (

    <div className="fakecall-page">

      <h1>📞 Fake Call</h1>


      <div className="fake-card">


        {/* =================================================
            CALLER
        ================================================== */}

        <label>Caller Name</label>

        <select
          value={caller}
          onChange={(e) =>
            setCaller(e.target.value)
          }
        >

          <option>Mom</option>

          <option>Dad</option>

          <option>Friend</option>

          <option>Police</option>

          <option>Custom</option>

        </select>


        {caller === "Custom" && (

          <>

            <label>
              Custom Caller Name
            </label>

            <input
              type="text"
              placeholder="Enter caller name"
              value={customCaller}
              onChange={(e) =>
                setCustomCaller(
                  e.target.value
                )
              }
            />


            <label>
              Phone Number
            </label>

            <input
              type="text"
              placeholder="+91 9876543210"
              value={customNumber}
              onChange={(e) =>
                setCustomNumber(
                  e.target.value
                )
              }
            />

          </>

        )}


        {/* =================================================
            CALL DELAY
        ================================================== */}

        <label>Call Delay</label>

        <select
          value={delay}
          onChange={(e) =>
            setDelay(
              Number(e.target.value)
            )
          }
        >

          <option value={3}>
            3 Seconds
          </option>

          <option value={5}>
            5 Seconds
          </option>

          <option value={10}>
            10 Seconds
          </option>

          <option value={15}>
            15 Seconds
          </option>

          <option value={30}>
            30 Seconds
          </option>

          <option value={60}>
            1 Minute
          </option>

        </select>


        {/* =================================================
            RINGTONE
        ================================================== */}

        <div className="audio-section">

          <h2>
            📳 Incoming Call Ringtone
          </h2>

          <p>
            This audio plays when the
            fake call arrives.
          </p>


          <label className="audio-btn">

            <FaUpload />

            Upload Ringtone

            <input
              type="file"
              accept="audio/*"
              hidden
              onChange={
                handleRingtoneUpload
              }
            />

          </label>


          {ringtoneAudio ? (

            <div className="audio-preview">

              <FaPhoneAlt size={25} />


              <div>

                <h3>
                  {ringtoneName}
                </h3>


                <audio
                  controls
                  src={ringtoneAudio}
                />


                <button
                  className="audio-delete-btn"
                  onClick={
                    handleDeleteRingtone
                  }
                >

                  <FaTrash />

                  Delete Ringtone

                </button>

              </div>

            </div>

          ) : (

            <div className="audio-preview">

              <FaPhoneAlt size={25} />


              <div>

                <h3>
                  Default Ringtone
                </h3>

                <p>
                  Default ringtone will
                  be used.
                </p>

              </div>

            </div>

          )}

        </div>


        {/* =================================================
            CONVERSATION
        ================================================== */}

        <div className="audio-section">

          <h2>
            🗣️ Call Conversation
          </h2>

          <p>
            This audio plays after you
            accept the call.
          </p>


          {/* AUDIO TYPE */}

          <div className="radio-group">

            <label>

              <input
                type="radio"
                checked={
                  audioType === "default"
                }
                onChange={() =>
                  setAudioType("default")
                }
              />

              Default Conversation

            </label>


            <label>

              <input
                type="radio"
                checked={
                  audioType === "custom"
                }
                onChange={() =>
                  setAudioType("custom")
                }
              />

              Custom Conversation

            </label>

          </div>


          {/* UPLOAD */}

          <label className="audio-btn">

            <FaUpload />

            Upload Conversation Audio

            <input
              type="file"
              accept="audio/*"
              hidden
              onChange={
                handleConversationUpload
              }
            />

          </label>


          {/* PREVIEW */}

          {conversationAudio ? (

            <div className="audio-preview">

              <FaPhoneAlt size={25} />


              <div>

                <h3>
                  {conversationName}
                </h3>


                <audio
                  controls
                  src={conversationAudio}
                />


                <button
                  className="audio-delete-btn"
                  onClick={
                    handleDeleteConversation
                  }
                >

                  <FaTrash />

                  Delete Conversation

                </button>

              </div>

            </div>

          ) : (

            <div className="audio-preview">

              <FaPhoneAlt size={25} />


              <div>

                <h3>
                  No Custom Conversation
                </h3>

                <p>
                  Default conversation will
                  be used.
                </p>

              </div>

            </div>

          )}

        </div>


        {/* =================================================
            SAVE
        ================================================== */}

        <button
          className="save-btn"
          onClick={() => {

            toast.success(
              "Fake call settings saved!"
            );

          }}
        >

          Save Fake Call

        </button>


        {/* =================================================
            TEST CALL
        ================================================== */}

        <button
          className="save-btn"
          onClick={startFakeCall}
        >

          📞 Test Fake Call

        </button>


      </div>

    </div>

  );

}

export default FakeCall;