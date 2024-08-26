import "./styles.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import ReactPlayer from "react-player";
import { Button, Input } from "@chakra-ui/react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import axios from "axios";

function JoinScreen({ getMeetingAndToken }) {
  const [meetingId, setMeetingId] = useState(null);
  const onClick = async () => {
    await getMeetingAndToken(meetingId);
  };
  return (
    <div className="firstMeeting">
      <Input
        className="inputMeeting"
        type="text"
        mb={2}
        placeholder="Enter Meeting Id"
        onChange={(e) => {
          setMeetingId(e.target.value);
        }}
      />
      <Button onClick={onClick}>Join</Button>
      <span className="orSpan">Or</span>
      <Button onClick={onClick}>Create Meeting</Button>
    </div>
  );
}

function ParticipantView(props) {
  const micRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, isLocal } = useParticipant(
    props.participantId
  );

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);

        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) =>
            console.error("videoElem.current.play() failed", error)
          );
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <div className="cameraChat">
      <audio ref={micRef} autoPlay playsInline muted={isLocal} />
      {webcamOn && (
        <ReactPlayer
          //
          playsinline // very very imp prop
          pip={false}
          light={false}
          controls={false}
          muted={true}
          playing={true}
          //
          url={videoStream}
          className="cameraItem"
          onError={(err) => {
            console.log(err, "participant video error");
          }}
        />
      )}
    </div>
  );
}

function Controls() {
  const { leave, toggleMic, toggleWebcam } = useMeeting();
  const [enbMic, setEnbMic] = useState(true);
  const [enbCam, setEnbCam] = useState(true);

  return (
    <div>
      <ExitToAppIcon className="controlsIcon" onClick={() => leave()}>
        Leave
      </ExitToAppIcon>
      {enbMic ? (
        <MicIcon
          className="controlsIcon"
          onClick={() => {
            toggleMic();
            setEnbMic(false);
          }}
        />
      ) : (
        <MicOffIcon
          className="controlsIcon"
          onClick={() => {
            toggleMic();
            setEnbMic(true);
          }}
        />
      )}
      {enbCam ? (
        <VideocamIcon
          className="controlsIcon"
          onClick={() => {
            toggleWebcam();
            setEnbCam(false);
          }}
        />
      ) : (
        <VideocamOffIcon
          className="controlsIcon"
          onClick={() => {
            toggleWebcam();
            setEnbCam(true);
          }}
        />
      )}
    </div>
  );
}

function MeetingView(props) {
  const [joined, setJoined] = useState(null);
  const { join, participants } = useMeeting({
    onMeetingJoined: () => {
      setJoined("JOINED");
    },
    onMeetingLeft: () => {
      props.onMeetingLeave();
    },
  });
  const joinMeeting = () => {
    setJoined("JOINING");
    join();
  };

  return (
    <div className="container">
      <div className="meetingID">
        <h3>Meeting Id: {props.meetingId}</h3>
      </div>
      {joined && joined === "JOINED" ? (
        <>
          <div className="participant">
            {[...participants.keys()].map((participantId) => (
              <>
                <ParticipantView
                  participantId={participantId}
                  key={participantId}
                />
              </>
            ))}
          </div>
          <div className="controls">
            <Controls />
          </div>
        </>
      ) : joined && joined === "JOINING" ? (
        <p style={{ color: "white", marginTop: "10px" }}>
          Joining the meeting...
        </p>
      ) : (
        <Button onClick={joinMeeting}>Join</Button>
      )}
    </div>
  );
}

function VideoCall({ user }) {
  const [meetingId, setMeetingId] = useState(null);
  const getMeetingAndToken = async (id) => {
    const config = {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };

    const { data } = await axios.get(`/api/chatvideo/get-token`, config);
    const token = data.token;
    const meetingId =
      id == null
        ? await axios.post(`/api/chatvideo/create-meeting`, { token }, config)
        : id;
    setMeetingId(meetingId.data.roomId);
  };

  const onMeetingLeave = () => {
    setMeetingId(null);
  };

  return meetingId ? (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: user.name,
        multiStream: true,
      }}
      token={meetingId}
      joinWithoutUserInteraction={true}
    >
      <MeetingView meetingId={meetingId} onMeetingLeave={onMeetingLeave} />
    </MeetingProvider>
  ) : (
    <JoinScreen getMeetingAndToken={getMeetingAndToken} />
  );
}

export default VideoCall;
