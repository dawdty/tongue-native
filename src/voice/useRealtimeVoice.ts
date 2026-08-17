import { useCallback, useEffect, useRef, useState } from "react";
import { mediaDevices, RTCPeerConnection, type MediaStream as WebRtcMediaStream } from "react-native-webrtc";
import { createSession, type SessionRequest } from "../api/session";

export type VoiceStatus = "idle" | "starting" | "connected" | "error";

export function useRealtimeVoice() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState("");
  const connectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<WebRtcMediaStream | null>(null);

  const cleanup = useCallback(() => {
    const stream = localStreamRef.current;
    stream?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    const connection = connectionRef.current;
    connectionRef.current = null;
    connection?.close();
  }, []);

  const stopVoice = useCallback(() => {
    cleanup();
    setStatus("idle");
    setRoleplayScenario("");
  }, [cleanup]);

  const startVoice = useCallback(
    async (request: SessionRequest) => {
      if (status === "starting" || status === "connected") return;

      setStatus("starting");
      setError(null);

      try {
        const session = await createSession(request);
        const ephemeralKey = session.client_secret?.value;
        const model = session.model;
        if (!ephemeralKey) {
          throw new Error("Session response missing client_secret.value.");
        }
        if (!model) {
          throw new Error("Session response missing model.");
        }

        setRoleplayScenario(session.roleplayScenario || "");

        const localStream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        localStreamRef.current = localStream;

        const connection = new RTCPeerConnection();
        connectionRef.current = connection;

        connection.onconnectionstatechange = () => {
          if (connection.connectionState === "connected") {
            setStatus("connected");
          }

          if (["closed", "disconnected", "failed"].includes(connection.connectionState)) {
            cleanup();
            setStatus("idle");
          }
        };

        const events = connection.createDataChannel("oai-events");
        events.onmessage = (message: unknown) => {
          try {
            const data = (message as { data: string }).data;
            const event = JSON.parse(data) as { type?: string; error?: { message?: string } };
            if (event.type === "error") {
              setError(event.error?.message || "Realtime session failed.");
            }
          } catch {
            setError("Received an invalid event from the Realtime session.");
          }
        };

        localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));

        const offer = await connection.createOffer({ offerToReceiveAudio: true });
        await connection.setLocalDescription(offer);

        const response = await fetch(
          "https://api.openai.com/v1/realtime/calls",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ephemeralKey}`,
              "Content-Type": "application/sdp",
            },
            body: offer.sdp,
          },
        );

        if (!response.ok) {
          throw new Error(`Realtime SDP exchange failed: ${response.status} ${await response.text()}`);
        }

        await connection.setRemoteDescription({
          type: "answer",
          sdp: await response.text(),
        });
      } catch (startError) {
        cleanup();
        setStatus("error");
        setError(startError instanceof Error ? startError.message : String(startError));
      }
    },
    [cleanup, status],
  );

  useEffect(() => cleanup, [cleanup]);

  return { status, error, roleplayScenario, startVoice, stopVoice };
}
